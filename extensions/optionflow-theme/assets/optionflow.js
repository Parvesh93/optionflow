(() => {
  const ROOT = "[data-optionflow-root]";
  const qs = (el, selector) => el.querySelector(selector);

  function productForm(root) {
    const section = root.closest(".shopify-section");
    return (
      (section && qs(section, 'form[action*="/cart/add"]')) ||
      qs(document, 'form[action*="/cart/add"]')
    );
  }

  function propertyInput(form, field) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name =
      "properties[" +
      String(field.label)
        .replace(/[\\[\\]]/g, "")
        .trim()
        .slice(0, 120) +
      "]";
    input.dataset.optionflowProperty = field.id;
    form.appendChild(input);
    return input;
  }

  function priceLabel(label, adjustment) {
    if (
      !adjustment ||
      adjustment.type === "NONE" ||
      !adjustment.value
    ) {
      return label;
    }

    const value = String(adjustment.value);
    const sign = Number(value) >= 0 ? "+" : "";
    const suffix =
      adjustment.type === "PERCENTAGE" ? "%" : "";

    return `${label} (${sign}${value}${suffix})`;
  }

  function valueOf(entry) {
    const { field, control } = entry;

    if (field.type === "CHECKBOX") {
      return control.checked ? "true" : "false";
    }

    if (field.type === "RADIO") {
      return (
        qs(control, 'input[type="radio"]:checked')?.value || ""
      );
    }

    return control.value || "";
  }

  function displayValue(entry) {
    const { field, control } = entry;

    if (field.type === "CHECKBOX") {
      return control.checked ? "Yes" : "";
    }

    if (field.type === "RADIO") {
      const checked = qs(
        control,
        'input[type="radio"]:checked',
      );
      return (
        checked?.dataset.optionflowLabel ||
        checked?.value ||
        ""
      );
    }

    if (field.type === "SELECT") {
      const selected =
        control.options[control.selectedIndex];
      return (
        selected?.dataset.optionflowLabel ||
        selected?.textContent ||
        ""
      );
    }

    return String(control.value || "");
  }

  function conditionMatches(condition, sourceValue) {
    if (!condition) return true;

    if (condition.operator === "EQUALS") {
      return sourceValue === condition.expectedValue;
    }

    if (condition.operator === "NOT_EQUALS") {
      return sourceValue !== condition.expectedValue;
    }

    if (condition.operator === "IS_CHECKED") {
      return sourceValue === "true";
    }

    if (condition.operator === "IS_NOT_CHECKED") {
      return sourceValue !== "true";
    }

    return true;
  }

  function fieldElement(field) {
    const wrap = document.createElement("div");
    wrap.className = "optionflow-field";
    wrap.dataset.optionflowField = field.id;

    let control;

    if (field.type === "CHECKBOX") {
      const label = document.createElement("label");
      label.className = "optionflow-choice";

      control = document.createElement("input");
      control.type = "checkbox";
      control.dataset.optionflowControl = field.id;

      const text = document.createElement("span");
      text.textContent = priceLabel(
        field.label,
        field.priceAdjustment,
      );

      label.append(control, text);
      wrap.appendChild(label);
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

      wrap.appendChild(label);

      if (field.type === "TEXTAREA") {
        control = document.createElement("textarea");
        control.placeholder = field.placeholder || "";
        wrap.appendChild(control);
      } else if (field.type === "SELECT") {
        control = document.createElement("select");

        const blank = document.createElement("option");
        blank.value = "";
        blank.textContent =
          field.placeholder || "Choose an option";
        control.appendChild(blank);

        field.values.forEach((item) => {
          const option = document.createElement("option");
          option.value = item.value;
          option.textContent = priceLabel(
            item.label,
            item.priceAdjustment,
          );
          option.dataset.optionflowLabel = item.label;
          control.appendChild(option);
        });

        wrap.appendChild(control);
      } else if (field.type === "RADIO") {
        control = document.createElement("div");
        control.className = "optionflow-choices";

        field.values.forEach((item) => {
          const label = document.createElement("label");
          label.className = "optionflow-choice";

          const input = document.createElement("input");
          input.type = "radio";
          input.name = "optionflow_" + field.id;
          input.value = item.value;
          input.dataset.optionflowLabel = item.label;

          const text = document.createElement("span");
          text.textContent = priceLabel(
            item.label,
            item.priceAdjustment,
          );

          label.append(input, text);
          control.appendChild(label);
        });

        wrap.appendChild(control);
      } else {
        control = document.createElement("input");
        control.type =
          field.type === "NUMBER" ? "number" : "text";
        control.placeholder = field.placeholder || "";
        wrap.appendChild(control);
      }

      control.dataset.optionflowControl = field.id;
    }

    if (field.helpText) {
      const help = document.createElement("div");
      help.className = "optionflow-field__help";
      help.textContent = field.helpText;
      wrap.appendChild(help);
    }

    return { wrap, control };
  }

  async function initRoot(root) {
    if (root.dataset.optionflowInitialized) return;
    root.dataset.optionflowInitialized = "1";

    const productGid =
      root.dataset.optionflowProductGid || "";
    const form = productForm(root);

    if (!productGid) {
      root.innerHTML =
        '<div class="optionflow-product-options__message">OptionFlow is available on product pages.</div>';
      return;
    }

    if (!form) {
      root.innerHTML =
        '<div class="optionflow-product-options__message">OptionFlow could not find the product form.</div>';
      return;
    }

    try {
      const response = await fetch(
        "/apps/optionflow?productGid=" +
          encodeURIComponent(productGid),
        { headers: { Accept: "application/json" } },
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
        title.className =
          "optionflow-product-options__title";
        title.textContent = optionSet.title;
        root.appendChild(title);
      }

      const container = document.createElement("div");
      container.className = "optionflow-fields";
      root.appendChild(container);

      const entries = new Map();

      optionSet.fields.forEach((field) => {
        const rendered = fieldElement(field);
        const property = propertyInput(form, field);

        container.appendChild(rendered.wrap);
        entries.set(field.id, {
          field,
          control: rendered.control,
          wrap: rendered.wrap,
          property,
        });
      });

      function sync() {
        entries.forEach((entry) => {
          let visible = true;

          if (entry.field.condition) {
            const source = entries.get(
              entry.field.condition.sourceFieldId,
            );
            visible = source
              ? conditionMatches(
                  entry.field.condition,
                  valueOf(source),
                )
              : true;
          }

          entry.wrap.hidden = !visible;
          entry.property.value = visible
            ? displayValue(entry)
            : "";
        });
      }

      entries.forEach(({ control }) => {
        control.addEventListener("change", sync);
        control.addEventListener("input", sync);
      });

      form.addEventListener("submit", (event) => {
        sync();

        for (const entry of entries.values()) {
          if (
            !entry.wrap.hidden &&
            entry.field.required &&
            !entry.property.value.trim()
          ) {
            event.preventDefault();
            event.stopImmediatePropagation();

            entry.wrap.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });

            if (
              !qs(
                entry.wrap,
                ".optionflow-field__error",
              )
            ) {
              const error =
                document.createElement("div");
              error.className =
                "optionflow-field__error";
              error.textContent =
                "Please complete this option.";
              error.style.color = "rgb(180, 0, 0)";
              entry.wrap.appendChild(error);
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
    document.querySelectorAll(ROOT).forEach(initRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  document.addEventListener("shopify:section:load", init);
})();
