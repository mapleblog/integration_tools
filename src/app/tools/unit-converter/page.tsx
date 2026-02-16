"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/shared/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Shuffle, Sigma } from "lucide-react";

type UnitCategoryKey =
  | "length"
  | "weight"
  | "temperature"
  | "area"
  | "volume"
  | "speed"
  | "storage";

type SimpleUnit = {
  key: string;
  label: string;
  symbol?: string;
};

type FactorUnit = SimpleUnit & {
  factor: number;
};

type UnitCategory = {
  key: UnitCategoryKey;
  name: string;
  baseUnit: string;
  type: "factor" | "custom";
  units: (FactorUnit | SimpleUnit)[];
};

const unitCategories: UnitCategory[] = [
  {
    key: "length",
    name: "Length",
    baseUnit: "m",
    type: "factor",
    units: [
      { key: "mm", label: "Millimeter", symbol: "mm", factor: 0.001 },
      { key: "cm", label: "Centimeter", symbol: "cm", factor: 0.01 },
      { key: "m", label: "Meter", symbol: "m", factor: 1 },
      { key: "km", label: "Kilometer", symbol: "km", factor: 1000 },
      { key: "inch", label: "Inch", symbol: "in", factor: 0.0254 },
      { key: "ft", label: "Foot", symbol: "ft", factor: 0.3048 },
    ],
  },
  {
    key: "weight",
    name: "Weight",
    baseUnit: "kg",
    type: "factor",
    units: [
      { key: "mg", label: "Milligram", symbol: "mg", factor: 0.000001 },
      { key: "g", label: "Gram", symbol: "g", factor: 0.001 },
      { key: "kg", label: "Kilogram", symbol: "kg", factor: 1 },
      { key: "t", label: "Ton", symbol: "t", factor: 1000 },
      { key: "lb", label: "Pound", symbol: "lb", factor: 0.45359237 },
      { key: "oz", label: "Ounce", symbol: "oz", factor: 0.0283495231 },
    ],
  },
  {
    key: "temperature",
    name: "Temperature",
    baseUnit: "C",
    type: "custom",
    units: [
      { key: "C", label: "Celsius", symbol: "°C" },
      { key: "F", label: "Fahrenheit", symbol: "°F" },
      { key: "K", label: "Kelvin", symbol: "K" },
    ],
  },
  {
    key: "area",
    name: "Area",
    baseUnit: "m2",
    type: "factor",
    units: [
      { key: "cm2", label: "Square centimeter", symbol: "cm²", factor: 0.0001 },
      { key: "m2", label: "Square meter", symbol: "m²", factor: 1 },
      { key: "km2", label: "Square kilometer", symbol: "km²", factor: 1000000 },
      { key: "acre", label: "Acre", symbol: "acre", factor: 4046.8564224 },
    ],
  },
  {
    key: "volume",
    name: "Volume",
    baseUnit: "L",
    type: "factor",
    units: [
      { key: "ml", label: "Milliliter", symbol: "mL", factor: 0.001 },
      { key: "L", label: "Liter", symbol: "L", factor: 1 },
      { key: "m3", label: "Cubic meter", symbol: "m³", factor: 1000 },
      { key: "gal", label: "Gallon (US)", symbol: "gal", factor: 3.785411784 },
    ],
  },
  {
    key: "speed",
    name: "Speed",
    baseUnit: "m_s",
    type: "factor",
    units: [
      { key: "m_s", label: "Meters per second", symbol: "m/s", factor: 1 },
      { key: "km_h", label: "Kilometers per hour", symbol: "km/h", factor: 0.277777778 },
      { key: "mph", label: "Miles per hour", symbol: "mph", factor: 0.44704 },
      { key: "kn", label: "Knots", symbol: "kn", factor: 0.514444 },
    ],
  },
  {
    key: "storage",
    name: "Data storage",
    baseUnit: "B",
    type: "factor",
    units: [
      { key: "bit", label: "Bit", symbol: "bit", factor: 0.125 },
      { key: "B", label: "Byte", symbol: "B", factor: 1 },
      { key: "KB", label: "Kilobyte", symbol: "KB", factor: 1024 },
      { key: "MB", label: "Megabyte", symbol: "MB", factor: 1048576 },
      { key: "GB", label: "Gigabyte", symbol: "GB", factor: 1073741824 },
      { key: "TB", label: "Terabyte", symbol: "TB", factor: 1099511627776 },
    ],
  },
];

function formatUnitLabel(unit: SimpleUnit) {
  if (unit.symbol && unit.symbol !== unit.key) {
    return `${unit.label} (${unit.symbol})`;
  }
  return `${unit.label} (${unit.key})`;
}

function convertFactorBased(
  value: number,
  from: FactorUnit,
  to: FactorUnit
) {
  const inBase = value * from.factor;
  return inBase / to.factor;
}

function convertTemperature(value: number, fromKey: string, toKey: string) {
  if (fromKey === toKey) return value;
  let celsius: number;
  if (fromKey === "C") {
    celsius = value;
  } else if (fromKey === "F") {
    celsius = (value - 32) * (5 / 9);
  } else if (fromKey === "K") {
    celsius = value - 273.15;
  } else {
    celsius = value;
  }
  if (toKey === "C") return celsius;
  if (toKey === "F") return celsius * (9 / 5) + 32;
  if (toKey === "K") return celsius + 273.15;
  return celsius;
}

export default function UnitConverterPage() {
  const [categoryKey, setCategoryKey] = useState<UnitCategoryKey>("length");
  const [fromUnitKey, setFromUnitKey] = useState("m");
  const [toUnitKey, setToUnitKey] = useState("km");
  const [inputValue, setInputValue] = useState("1");

  const currentCategory = useMemo(
    () => unitCategories.find((c) => c.key === categoryKey) ?? unitCategories[0],
    [categoryKey]
  );

  const currentUnits = currentCategory.units;

  const handleCategoryChange = (key: UnitCategoryKey) => {
    setCategoryKey(key);
    const first = unitCategories
      .find((c) => c.key === key)
      ?.units[0];
    const second = unitCategories
      .find((c) => c.key === key)
      ?.units[1];
    setFromUnitKey(first?.key ?? "");
    setToUnitKey(second?.key ?? first?.key ?? "");
    setResultValue("");
  };

  const handleSwap = () => {
    setFromUnitKey(toUnitKey);
    setToUnitKey(fromUnitKey);
    if (resultValue) {
      setInputValue(resultValue);
    }
  };

  const resultValue = (() => {
    const raw = inputValue.replace(",", ".");
    if (!raw.trim()) {
      return "";
    }

    const value = Number(raw);
    if (Number.isNaN(value)) {
      return "";
    }

    if (!currentCategory) {
      return "";
    }

    let result: number;

    if (currentCategory.type === "factor") {
      const fromUnit = currentUnits.find((u) => u.key === fromUnitKey) as FactorUnit | undefined;
      const toUnit = currentUnits.find((u) => u.key === toUnitKey) as FactorUnit | undefined;

      if (!fromUnit || !toUnit) {
        return "";
      }

      result = convertFactorBased(value, fromUnit, toUnit);
    } else {
      result = convertTemperature(value, fromUnitKey, toUnitKey);
    }

    const formatted =
      Math.abs(result) < 0.0001 || Math.abs(result) > 100000
        ? result.toExponential(6)
        : result.toLocaleString(undefined, {
            maximumFractionDigits: 8,
            minimumFractionDigits: 0,
          });

    return formatted;
  })();

  const fromUnit = currentUnits.find((u) => u.key === fromUnitKey) ?? currentUnits[0];
  const toUnit = currentUnits.find((u) => u.key === toUnitKey) ?? currentUnits[1] ?? currentUnits[0];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto py-8 max-w-4xl space-y-6">
        <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/" className="text-sm font-medium">
            Back to Tools
          </Link>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sigma className="h-7 w-7 text-emerald-500" />
            Unit Converter
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Quickly convert common units such as length, weight, temperature, area, volume, speed, and data storage.
          </p>
        </div>

        <Card>
          <CardContent className="p-5 space-y-5">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Conversion type</p>
              <Select
                value={categoryKey}
                onValueChange={(value) => handleCategoryChange(value as UnitCategoryKey)}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Choose the type to convert" />
                </SelectTrigger>
                <SelectContent>
                  {unitCategories.map((category) => (
                    <SelectItem key={category.key} value={category.key}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-[minmax(0,1.2fr)_auto_minmax(0,1.2fr)] gap-4 items-end">
              <div className="space-y-2">
                <p className="text-sm font-medium">Input value</p>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter the value to convert"
                />
                <Select
                  value={fromUnit.key}
                  onValueChange={(value) => setFromUnitKey(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map((unit) => (
                      <SelectItem key={unit.key} value={unit.key}>
                        {formatUnitLabel(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-center pb-6 md:pb-0">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSwap}
                  className="rounded-full"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Result</p>
                <Input value={resultValue} readOnly placeholder="The result will appear here" />
                <Select
                  value={toUnit.key}
                  onValueChange={(value) => setToUnitKey(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUnits.map((unit) => (
                      <SelectItem key={unit.key} value={unit.key}>
                        {formatUnitLabel(unit)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <p className="text-[11px] text-muted-foreground md:text-xs">
                Changing the value or units automatically recalculates the result. Values support decimals and scientific
                notation; temperature conversion correctly handles the non-linear relationship between °C, °F, and K, and
                data storage uses 1 KB = 1024 B.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
