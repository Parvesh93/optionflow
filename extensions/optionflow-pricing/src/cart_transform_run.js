const NO_CHANGES = { operations: [] };

function parseSelection(raw) {
  if (!raw) return {};

  try {
    const value = JSON.parse(raw);
    return value && typeof value === "object"
      ? value
      : {};
  } catch {
    return {};
  }
}

function matchesCondition(condition, sourceValue) {
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

  return false;
}

function fieldIsVisible(
  field,
  fieldsById,
  selections,
  visiting = new Set(),
) {
  if (!field?.condition) {
    return true;
  }

  if (visiting.has(field.id)) {
    return false;
  }

  visiting.add(field.id);

  const source = fieldsById.get(
    field.condition.sourceFieldId,
  );

  if (!source) {
    return false;
  }

  if (
    !fieldIsVisible(
      source,
      fieldsById,
      selections,
      visiting,
    )
  ) {
    return false;
  }

  return matchesCondition(
    field.condition,
    String(
      selections[field.condition.sourceFieldId] ?? "",
    ),
  );
}

function adjustmentAmount(
  adjustment,
  baseAmount,
  presentmentRate,
) {
  if (
    !adjustment ||
    adjustment.type === "NONE" ||
    adjustment.value === "" ||
    adjustment.value == null
  ) {
    return 0;
  }

  const value = Number(adjustment.value);

  if (!Number.isFinite(value)) {
    return 0;
  }

  if (adjustment.type === "FIXED") {
    return value * presentmentRate;
  }

  if (adjustment.type === "PERCENTAGE") {
    return baseAmount * (value / 100);
  }

  return 0;
}

function calculateAdjustment(
  config,
  selections,
  baseAmount,
  presentmentRate,
) {
  if (
    !config?.enabled ||
    !Array.isArray(config.fields)
  ) {
    return 0;
  }

  const fieldsById = new Map(
    config.fields.map((field) => [field.id, field]),
  );

  let total = 0;

  for (const field of config.fields) {
    if (
      !fieldIsVisible(
        field,
        fieldsById,
        selections,
      )
    ) {
      continue;
    }

    const selected = selections[field.id];

    if (
      selected == null ||
      selected === "" ||
      selected === "false"
    ) {
      continue;
    }

    if (
      field.type === "SELECT" ||
      field.type === "RADIO"
    ) {
      const option = Array.isArray(field.values)
        ? field.values.find(
            (value) =>
              value.value === String(selected),
          )
        : null;

      if (option) {
        total += adjustmentAmount(
          option.adjustment,
          baseAmount,
          presentmentRate,
        );
      }

      continue;
    }

    total += adjustmentAmount(
      field.adjustment,
      baseAmount,
      presentmentRate,
    );
  }

  return total;
}

function buildOperation(
  line,
  addonVariantId,
  presentmentRate,
) {
  if (
    line.merchandise.__typename !== "ProductVariant"
  ) {
    return null;
  }

  const config =
    line.merchandise.product.optionflowPricing
      ?.jsonValue;

  if (!config?.enabled) {
    return null;
  }

  const selections = parseSelection(
    line.optionflowSelection?.value,
  );

  const baseAmount = Number(
    line.cost.amountPerQuantity.amount,
  );

  if (!Number.isFinite(baseAmount)) {
    return null;
  }

  const adjustment = calculateAdjustment(
    config,
    selections,
    baseAmount,
    presentmentRate,
  );

  if (Math.abs(adjustment) < 0.005) {
    return null;
  }

  const originalPrice = Math.max(
    0,
    baseAmount + Math.min(0, adjustment),
  );

  const addonPrice = Math.max(0, adjustment);

  return {
    lineExpand: {
      cartLineId: line.id,
      title: line.merchandise.title,
      expandedCartItems: [
        {
          merchandiseId: line.merchandise.id,
          quantity: 1,
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: originalPrice.toFixed(2),
              },
            },
          },
        },
        {
          merchandiseId: addonVariantId,
          quantity: 1,
          price: {
            adjustment: {
              fixedPricePerUnit: {
                amount: addonPrice.toFixed(2),
              },
            },
          },
        },
      ],
    },
  };
}

export function cartTransformRun(input) {
  const addonVariantId =
    input.cartTransform?.optionflowConfig?.jsonValue
      ?.addonVariantId;

  if (!addonVariantId) {
    return NO_CHANGES;
  }

  const presentmentRate = Number(
    input.presentmentCurrencyRate || 1,
  );

  const operations = input.cart.lines
    .map((line) =>
      buildOperation(
        line,
        addonVariantId,
        presentmentRate,
      ),
    )
    .filter(Boolean);

  return operations.length
    ? { operations }
    : NO_CHANGES;
}
