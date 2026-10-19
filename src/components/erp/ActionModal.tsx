import type { ElementType } from "react";
import { ClipboardPenLine } from "lucide-react";
import { Modal, ModalFooter } from "@/components/erp/Modal";
import { PrimaryButton, SecondaryButton } from "@/components/erp/Ui";

export interface ActionField {
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number;
}

interface ActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  submitLabel: string;
  fields: ActionField[];
  icon?: ElementType;
  onSubmit: (values: Record<string, string>) => void;
}

/** A compact configurable form for local mock workflows. */
export function ActionModal({
  open,
  onClose,
  title,
  description,
  submitLabel,
  fields,
  icon = ClipboardPenLine,
  onSubmit,
}: ActionModalProps) {
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = new FormData(event.currentTarget);
    const values = Object.fromEntries(entries.entries()) as Record<
      string,
      string
    >;
    onSubmit(values);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const className = `field-label ${field.type === "textarea" ? "sm:col-span-2" : ""}`;
            const commonProps = {
              name: field.name,
              required: field.required,
              defaultValue: field.defaultValue,
              className: "field-input",
            };

            return (
              <label className={className} key={field.name}>
                {field.label}
                {field.type === "select" ? (
                  <select {...commonProps}>
                    {(field.options ?? []).map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    {...commonProps}
                    rows={3}
                    placeholder={field.placeholder}
                    className="field-input h-auto resize-none py-3"
                  />
                ) : (
                  <input
                    {...commonProps}
                    type={field.type ?? "text"}
                    min={field.type === "number" ? "0" : undefined}
                    placeholder={field.placeholder}
                  />
                )}
              </label>
            );
          })}
        </div>
        <ModalFooter>
          <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
          <PrimaryButton type="submit">{submitLabel}</PrimaryButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
