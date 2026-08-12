"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
  ComboboxValue,
  useComboboxAnchor,
} from "@aloysius-web/ui/components/combobox";

interface NameListInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function NameListInput({
  value,
  onChange,
  placeholder = "Add name...",
  className,
}: NameListInputProps) {
  const anchor = useComboboxAnchor();
  const [searchValue, setSearchValue] = useState("");

  const items = value.filter((name) => name.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <Combobox
      multiple
      value={value}
      onValueChange={onChange}
      filter={null}
      onInputValueChange={(nextSearchValue) => {
        setSearchValue(nextSearchValue);
      }}
    >
      <ComboboxChips ref={anchor} className={className}>
        <ComboboxValue>
          {(values) => (
            <>
              {values.map((item: string) => (
                <ComboboxChip key={item}>{item}</ComboboxChip>
              ))}
              <ComboboxChipsInput placeholder={values.length > 0 ? "" : placeholder} />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>
          {searchValue.trim() ? (
            <button
              type="button"
              className="w-full px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault();
                if (searchValue.trim() && !value.includes(searchValue.trim())) {
                  onChange([...value, searchValue.trim()]);
                  setSearchValue("");
                }
              }}
            >
              Add &quot;{searchValue.trim()}&quot;
            </button>
          ) : (
            "Type a name and press Enter..."
          )}
        </ComboboxEmpty>
        {items.length > 0 && (
          <ComboboxList>
            {items.map((item) => (
              <ComboboxItem key={item} value={item}>
                {item}
              </ComboboxItem>
            ))}
          </ComboboxList>
        )}
      </ComboboxContent>
    </Combobox>
  );
}
