"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@aloysius-web/ui/components/combobox";
import { orpc } from "@/utils/orpc";

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tags...",
  className,
}: TagInputProps) {
  const anchor = useComboboxAnchor();
  const [searchValue, setSearchValue] = useState("");

  const { data: allTags = [] } = useQuery(
    orpc.tags.list.queryOptions({ input: { search: searchValue || undefined } }),
  );

  const items = allTags.filter((tag) => !value.includes(tag));

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
                if (searchValue.trim()) {
                  onChange([...value, searchValue.trim()]);
                  setSearchValue("");
                }
              }}
            >
              Create &quot;{searchValue.trim()}&quot;
            </button>
          ) : (
            "Type to add tags..."
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
