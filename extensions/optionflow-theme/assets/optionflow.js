(() => {
  const ROOT = "[data-optionflow-root]";
  const q = (el, s) => el.querySelector(s);

  function formFor(root) {
    const section = root.closest(".shopify-section");
    return (
      (section && q(section, 'form[action*="/cart/add"]')) ||
      q(document, 'form[action*="/cart/add"]')
    );
  }

  function hidden(form, name) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
    return input;
  }

  function property(form, field) {
    return hidden(
      form,
      "properties[" +
        String(field.label)
          .replace(/[\\[\\]]/g, "")
          .trim()
          .slice(0, 120) +
        "]",
    );
  }

  function priced(label, adjustment) {
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

  function raw(entry) {
    const { field, control } = entry;

    if (field.type === "CHECKBOX") {
      return control.checked ? "true" : "";
    }

    if (field.type === "RADIO") {
      return (
        q(control, 'input[type="radio"]:checked')
          ?.value || ""
      );
    }

    return control.value || "";
  }

  function display(entry) {
    const { field, control } = entry;

    if (field.type === "CHECKBOX") {
      return control.checked ? "Yes" : "";
    }

    if (field.type === "RADIO") {
      const checked = q(
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

  function matches(condition, value) {
    if (!condition) return true;
    if (condition.operator === "EQUALS") {
      return value === condition.expectedValue;
    }
    if (condition.operator === "NOT_EQUALS") {
      return value !== condition.expectedValue;
    }
    if (condition.operator === "IS_CHECKED") {
      return value === "true";
    }
    if (condition.operator === "IS_NOT_CHECKED") {
      return value !== "true";
    }
    return false;
  }

  function render(field) {
    const wrap = document.createElement("div");
    wrap.className = "optionflow-field";

    let control;

    if (field.type === "CHECKBOX") {
      const label = document.createElement("label");
      label.className = "optionflow-choice";

      control = document.createElement("input");
      control.type = "checkbox";

      const text = document.createElement("span");
      text.textContent = priced(
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
          option.textContent = priced(
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
          text.textContent = priced(
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
    }

    if (field.helpText) {
      const help = document.createElement("div");
      help.className = "optionflow-field__help";
      help.textContent = field.helpText;
      wrap.appendChild(help);
    }

    return { wrap, control };
  }

  async function init(root) {
    if (root.dataset.optionflowInitialized) return;
    root.dataset.optionflowInitialized = "1";

    const productGid =
      root.dataset.optionflowProductGid || "";
    const form = formFor(root);

    if (!productGid || !form) {
      root.hidden = true;
      return;
    }

    try {
      const response = await fetch(
        "/apps/optionflow?productGid=" +
          encodeURIComponent(productGid),
        { headers: { Accept: "application/json" } },
      );

      const payload = await response.json();

      if (response.status === 404) {
        root.hidden = true;
        return;
      }

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Load failed.");
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

      const selection = hidden(
        form,
        "properties[_optionflow_selection]",
      );
      const entries = new Map();

      optionSet.fields.forEach((field) => {
        const rendered = render(field);
        container.appendChild(rendered.wrap);

        entries.set(field.id, {
          field,
          control: rendered.control,
          wrap: rendered.wrap,
          property: property(form, field),
        });
      });

      function sync() {
        const selected = {};

        entries.forEach((entry) => {
          let visible = true;

          if (entry.field.condition) {
            const source = entries.get(
              entry.field.condition.sourceFieldId,
            );
            visible = source
              ? matches(
                  entry.field.condition,
                  raw(source),
                )
              : false;
          }

          entry.wrap.hidden = !visible;

          if (!visible) {
            entry.property.value = "";
            return;
          }

          const value = raw(entry);
          entry.property.value = display(entry);

          if (value) {
            selected[entry.field.id] = value;
          }
        });

        selection.value = JSON.stringify(selected);
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

            if (!q(entry.wrap, ".optionflow-field__error")) {
              const error = document.createElement("div");
              error.className = "optionflow-field__error";
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
        '<div class="optionflow-product-options__message">Options unavailable.</div>';
      console.error("OptionFlow", error);
    }
  }

  function boot() {
    document.querySelectorAll(ROOT).forEach(init);
  }

  document.readyState === "loading"
    ? document.addEventListener(
        "DOMContentLoaded",
        boot,
      )
    : boot();

  document.addEventListener("shopify:section:load", boot);
})();
