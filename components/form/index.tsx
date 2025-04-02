"use client";

import LoadingDots from "@/components/icons/loading-dots";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import DomainStatus from "./domain-status";
import DomainConfiguration from "./domain-configuration";
import Uploader from "./uploader";
import va from "@vercel/analytics";
import { SelectSchool } from "@/lib/schema";

type BaseInputAttrs = {
  name: string;
  label: string;
  type: string;
};

type TextInputAttrs = BaseInputAttrs & {
  type: "text" | "email" | "password";
  defaultValue: string;
  placeholder?: string;
  maxLength?: number;
};

type ColorPickerAttrs = BaseInputAttrs & {
  type: "color-picker";
  defaultValue: {
    primary: string;
    secondary: string;
    accent: string;
  };
};

type SelectAttrs = BaseInputAttrs & {
  type: "select";
  defaultValue: string;
  options: Array<{ value: string; label: string }>;
};

type CodeEditorAttrs = BaseInputAttrs & {
  type: "code-editor";
  defaultValue: string;
  language: string;
};

type MarkdownAttrs = BaseInputAttrs & {
  type: "markdown";
  defaultValue: string;
  placeholder?: string;
};

type InputAttrs = TextInputAttrs | ColorPickerAttrs | SelectAttrs | CodeEditorAttrs | MarkdownAttrs;

function isColorPickerAttrs(attrs: InputAttrs): attrs is ColorPickerAttrs {
  return attrs.type === "color-picker";
}

function isSelectAttrs(attrs: InputAttrs): attrs is SelectAttrs {
  return attrs.type === "select";
}

function isCodeEditorAttrs(attrs: InputAttrs): attrs is CodeEditorAttrs {
  return attrs.type === "code-editor";
}

function isMarkdownAttrs(attrs: InputAttrs): attrs is MarkdownAttrs {
  return attrs.type === "markdown";
}

interface FormProps {
  title: string;
  description: string;
  helpText: string;
  inputAttrs: InputAttrs;
  handleSubmit: (formData: FormData | null, school: SelectSchool, key: string | null) => Promise<any>;
  school: any;
}

export default function Form({
  title,
  description,
  helpText,
  inputAttrs,
  handleSubmit,
  school,
}: FormProps): JSX.Element {
  const router = useRouter();
  const { update } = useSession();
  console.log({"School from Forms:":school})
  return (
    <form
      action={async (formData: FormData) => {
        handleSubmit(formData, school, inputAttrs.name).then(async (res: any) => {
          if (res.error) {
            console.log({"School in Form": school})
            toast.error(res.error);
          } else {
            va.track(`Updated ${inputAttrs.name}`, { id: school.id });
            router.refresh();
            toast.success(`Successfully updated ${inputAttrs.name}!`);
          }
        });
      }}
      className="rounded-lg border border-stone-200 bg-white dark:border-stone-700 dark:bg-black"
    >
      <div className="relative flex flex-col space-y-4 p-5 sm:p-10">
        <h2 className="font-cal text-xl dark:text-white">{title}</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {description}
        </p>
        {inputAttrs.name === "image" || inputAttrs.name === "logo" ? (
          <Uploader
            defaultValue={inputAttrs.defaultValue as string}
            name={inputAttrs.name}
          />
        ) : inputAttrs.name === "font" ? (
          <div className="flex max-w-sm items-center overflow-hidden rounded-lg border border-stone-600">
            <select
              name="font"
              defaultValue={inputAttrs.defaultValue as string}
              className="w-full rounded-none border-none bg-white px-4 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-black dark:bg-black dark:text-stone-200 dark:focus:ring-white"
              aria-label="Font selection"
            >
              <option value="font-cal">Cal Sans</option>
              <option value="font-lora">Lora</option>
              <option value="font-work">Work Sans</option>
            </select>
          </div>
        ) : isSelectAttrs(inputAttrs) ? (
          <div className="flex max-w-sm items-center overflow-hidden rounded-lg border border-stone-600">
            <select
              name={inputAttrs.name}
              defaultValue={inputAttrs.defaultValue}
              className="w-full rounded-none border-none bg-white px-4 py-2 text-sm font-medium text-stone-700 focus:outline-none focus:ring-black dark:bg-black dark:text-stone-200 dark:focus:ring-white"
              aria-label={inputAttrs.label}
            >
              {inputAttrs.options.map((option: { value: string; label: string }) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : isColorPickerAttrs(inputAttrs) ? (
          <div className="flex gap-4">
            <div>
              <label className="text-sm font-medium">Primary</label>
              <input
                type="color"
                name="primaryColor"
                defaultValue={inputAttrs.defaultValue.primary}
                className="mt-1 h-10 w-full rounded-md border border-stone-300"
                aria-label="Primary color"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Secondary</label>
              <input
                type="color"
                name="secondaryColor"
                defaultValue={inputAttrs.defaultValue.secondary}
                className="mt-1 h-10 w-full rounded-md border border-stone-300"
                aria-label="Secondary color"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Accent</label>
              <input
                type="color"
                name="accentColor"
                defaultValue={inputAttrs.defaultValue.accent}
                className="mt-1 h-10 w-full rounded-md border border-stone-300"
                aria-label="Accent color"
              />
            </div>
          </div>
        ) : isCodeEditorAttrs(inputAttrs) ? (
          <textarea
            name={inputAttrs.name}
            defaultValue={inputAttrs.defaultValue}
            className="w-full max-w-xl rounded-md border border-stone-300 text-sm text-stone-900 placeholder-stone-300 focus:border-stone-500 focus:outline-none focus:ring-stone-500 dark:border-stone-600 dark:bg-black dark:text-white dark:placeholder-stone-700"
            rows={3}
            required
            data-language={inputAttrs.language}
            aria-label={inputAttrs.label}
            placeholder={inputAttrs.label}
          />
        ) : isMarkdownAttrs(inputAttrs) ? (
          <textarea
            name={inputAttrs.name}
            defaultValue={inputAttrs.defaultValue}
            className="w-full max-w-xl rounded-md border border-stone-300 text-sm text-stone-900 placeholder-stone-300 focus:border-stone-500 focus:outline-none focus:ring-stone-500 dark:border-stone-600 dark:bg-black dark:text-white dark:placeholder-stone-700"
            rows={3}
            required
            aria-label={inputAttrs.label}
            placeholder={inputAttrs.placeholder}
          />
        ) : inputAttrs.name === "subdomain" ? (
          <div className="flex w-full max-w-md">
            <input
              {...inputAttrs}
              required
              className="w-full rounded-md border border-stone-300 text-sm text-stone-900 placeholder-stone-300 focus:border-stone-500 focus:outline-none focus:ring-stone-500 dark:border-stone-600 dark:bg-black dark:text-white dark:placeholder-stone-700"
            />
            <span className="ml-2 flex items-center text-sm text-stone-500">
              .edutrac.com
            </span>
          </div>
        ) : (
          <input
            {...inputAttrs}
            required
            className="w-full max-w-md rounded-md border border-stone-300 text-sm text-stone-900 placeholder-stone-300 focus:border-stone-500 focus:outline-none focus:ring-stone-500 dark:border-stone-600 dark:bg-black dark:text-white dark:placeholder-stone-700"
          />
        )}
      </div>
      {inputAttrs.name === "customDomain" && inputAttrs.defaultValue && (
        <DomainConfiguration domain={inputAttrs.defaultValue as string} />
      )}
      <div className="flex flex-col items-center justify-center space-y-2 rounded-b-lg border-t border-stone-200 bg-stone-50 p-3 sm:flex-row sm:justify-between sm:space-y-0 sm:px-10 dark:border-stone-700 dark:bg-stone-800">
        <p className="text-sm text-stone-500 dark:text-stone-400">{helpText}</p>
        <FormButton />
      </div>
    </form>
  );
}

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className={cn(
        "flex h-8 w-32 items-center justify-center space-x-2 rounded-md border text-sm transition-all focus:outline-none sm:h-10",
        pending
          ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300"
          : "border-black bg-black text-white hover:bg-white hover:text-black dark:border-stone-700 dark:hover:border-stone-200 dark:hover:bg-black dark:hover:text-white dark:active:bg-stone-800",
      )}
      disabled={pending}
    >
      {pending ? <LoadingDots color="#808080" /> : <p>Save Changes</p>}
    </button>
  );
}
