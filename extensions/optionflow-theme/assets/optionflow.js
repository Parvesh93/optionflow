(() => {
  const ROOT_SELECTOR = "[data-optionflow-root]";

  function escapePropertyLabel(label) {
    return String(label)
      .replace(/[\\[\\]]/g, "")
      .trim()
      .slice(0, 120);
  }

  function findProductForm(root) {
    const section = root.closest(".shopify-section");

    if (section) {
      const localForm = section.querySelector(
        'form[action*="/cart/add"]',
      );
      if (localForm) return localForm;
    }

    return document.querySelector(
      'form[action*="/cart/add"]',
    );
  }

  function createHiddenProperty(form, fieldId, label) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.dataset.optionflowProperty = fieldId;
    input.name = `properties[${escapePropertyLabel(label)}]`;
    input.value = "";
    form.appendChild(input);
    return input;
  }

  function formatAdjustment(adjustment) {
    if (
      !adjustment ||
      adjustment.type === "NONE" ||
      !adjustment.value
    ) {
      return "";
    }

    const numeric = Number(adjustment.value);
    const sign = numeric >= 0 ? "+" : "";

    if (adjustment.type === "PERCENTAGE") {
      return `${sign}${adjustment.value}%`;
    }

    return `${sign}${adjustment.value}`;
  }

  function optionLabel(label, adjustment) {
    const price = formatAdjustment(adjustment);
    return price ? `${label} (${price})` : label;
  }

  function currentValue(control, field) {
    if (field.type === "CHECKBOX") {
      return control.checked ? "true" : "false";
    }

    if (field.type === "RADIO") {
      const checked = control.querySelector(
        'input[type="radio"]:checked',
      );
      return checked ? checked.value : "";
    }

    return control.value ?? "";
  }

  function matchesCondition(condition, sourceValue) {
    if (!condition) return true;

    switch (condition.operator) {
      case "EQUALS":
        return sourceValue === condition.expectedValue;
      case "NOT_EQUALS":
        return sourceValue !== condition.expectedValue;
      case "IS_CHECKED":
        return sourceValue === "true";
      case "IS_NOT_CHECKED":
        return sourceValue !== "true";
      default:
        return true;
    }
  }

  function renderField(field) {
    const wrapper = document.createElement("div");
    wrapper.className = "optionflow-field";
    wrapper.dataset.optionflowField = field.id;

    let control;

    if (field.type === "CHECKBOX") {
      const choice = document.createElement("label");
      choice.className = "optionflow-choice";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.optionflowControl = field.id;

      const text = document.createElement("span");
      text.textContent = optionLabel(
        field.label,
        field.priceAdjustment,
      );

      choice.append(input, text);
      wrapper.appendChild(choice);
      control = input;
    } else {
      const label = document.createElement("label");
      label.className = "optionflow-field__label";
      label.textContent = field.label;

      if (field.required) {
        const star = document.createElement("span");
        star.className = "optionflow-field__required";
        star.textContent = "*";
        label.appendChild(star);
      }

      wrapper.appendChild(label);

      if (field.type === "TEXTAREA") {
        control = document.createElement("textarea");
        control.placeholder = field.placeholder || "";
        control.dataset.optionflowControl = field.id;
        wrapper.appendChild(control);
      } else if (field.type === "SELECT") {
        control = document.createElement("select");
        control.dataset.optionflowControl = field.id;

        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent =
          field.placeholder || "Choose an option";
        control.appendChild(blank);

        field.values.forEach((value) => {
          const option = document.createElement("option");
          option.value = value.value;
          option.textContent = optionLabel(
            value.label,
            value.priceAdjustment,
          );
          option.dataset.optionflowLabel = value.label;
          control.appendChild(option);
        });

        wrapper.appendChild(control);
      } else if (field.type === "RADIO") {
        const group = document.createElement("div");
        group.className = "optionflow-choices";
        group.dataset.optionflowControl = field.id;

        field.values.forEach((value) => {
          const choice = document.createElement("label");
          choice.className = "optionflow-choice";

          const input = document.createElement("input");
          input.type = "radio";
          input.name = `optionflow_${field.id}`;
          input.value = value.value;
          input.dataset.optionflowLabel = value.label;

          const text = document.createElement("span");
          text.textContent = optionLabel(
            value.label,
            value.priceAdjustment,
          );

          choice.append(input, text);
          group.appendChild(choice);
        });

        control = group;
        wrapper.appendChild(group);
      } else {
        control = document.createElement("input");
        control.type =
          field.type === "NUMBER" ? "number" : "text";
        control.placeholder = field.placeholder || "";
        control.dataset.optionflowControl = field.id;
        wrapper.appendChild(control);
      }
    }

    if (field.helpText) {
      const help = document.createElement("div");
      help.className = "optionflow-field__help";
      help.textContent = field.helpText;
      wrapper.appendChild(help);
    }

    return { wrapper, control };
  }

  function selectedDisplayValue(field, control) {
    if (field.type === "CHECKBOX") {
      return control.checked ? "Yes" : "";
    }

    if (field.type === "RADIO") {
      const checked = control.querySelector(
        'input[type="radio"]:checked',
      );
      return checked
        ? checked.dataset.optionflowLabel || checked.value
        : "";
    }

    if (field.type === "SELECT") {
      const selected =
        control.options[control.selectedIndex];
      return selected
        ? selected.dataset.optionflowLabel ||
            selected.textContent ||
            ""
        : "";
    }

    return String(control.value || "");
  }

  async function initRoot(root) {
    if (root.dataset.optionflowInitialized === "true") {
      return;
    }

    root.dataset.optionflowInitialized = "true";

    const handle = root.dataset.optionflowHandle || "";

    if (!handle) {
      root.innerHTML =
        '<div class="optionflow-product-options__message">Select an OptionFlow option set in the theme editor.</div>';
      return;
    }

    const form = findProductForm(root);

    if (!form) {
      root.innerHTML =
        '<div class="optionflow-product-options__message">OptionFlow could not find the product form.</div>';
      return;
    }

    try {
      const response = await fetch(
        `/apps/optionflow?handle=${encodeURIComponent(handle)}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error || "Unable to load options.",
        );
      }

      const optionSet = payload.optionSet;
      root.innerHTML = "";

      if (
        root.dataset.optionflowShowTitle === "true" &&
        optionSet.title
      ) {
        const title = document.createElement("div");
        title.className = "optionflow-product-options__title";
        title.textContent = optionSet.title;
        root.appendChild(title);
      }

      const fieldsContainer = document.createElement("div");
      fieldsContainer.className = "optionflow-fields";
      root.appendChild(fieldsContainer);

      const fieldMap = new Map();

      optionSet.fields.forEach((field) => {
        const rendered = renderField(field);
        const propertyInput = createHiddenProperty(
          form,
          field.id,
          field.label,
        );

        fieldsContainer.appendChild(rendered.wrapper);

        fieldMap.set(field.id, {
          field,
          wrapper: rendered.wrapper,
          control: rendered.control,
          propertyInput,
        });
      });

      function sync() {
        fieldMap.forEach((entry) => {
          const { field, wrapper, control, propertyInput } =
            entry;

          let visible = true;

          if (field.condition) {
            const source = fieldMap.get(
              field.condition.sourceFieldId,
            );

            if (source) {
              visible = matchesCondition(
                field.condition,
                currentValue(
                  source.control,
                  source.field,
                ),
              );
            }
          }

          wrapper.hidden = !visible;

          if (!visible) {
            propertyInput.value = "";
            return;
          }

          propertyInput.value = selectedDisplayValue(
            field,
            control,
          );
        });
      }

      fieldMap.forEach((entry) => {
        const control = entry.control;
        control.addEventListener("change", sync);
        control.addEventListener("input", sync);
      });

      form.addEventListener("submit", (event) => {
        sync();

        for (const entry of fieldMap.values()) {
          const { field, wrapper, propertyInput } = entry;

          if (
            !wrapper.hidden &&
            field.required &&
            !propertyInput.value.trim()
          ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            wrapper.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            const existing =
              wrapper.querySelector(
                ".optionflow-field__error",
              );

            if (!existing) {
              const error =
                document.createElement("div");
              error.className =
                "optionflow-field__error";
              error.style.color = "rgb(180, 0, 0)";
              error.textContent =
                "Please complete this required option.";
              wrapper.appendChild(error);
            }

            return;
          }
        }
      });

      sync();
    } catch (error) {
      root.innerHTML =
        '<div class="optionflow-product-options__message">Unable to load product options right now.</div>';
      console.error("OptionFlow storefront error", error);
    }
  }

  function init() {
    document
      .querySelectorAll(ROOT_SELECTOR)
      .forEach(initRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener(
    "shopify:section:load",
    init,
  );
})();
