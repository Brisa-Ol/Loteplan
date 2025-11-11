// src/components/common/FormTextField/FormTextField.tsx

import React from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import type { FormikProps } from "formik";

interface FormTextFieldProps extends Omit<TextFieldProps, "error" | "helperText"> {
  formik: FormikProps<any>;
  name: string;
}

/**
 * TextField integrado con Formik
 * Maneja automáticamente el estado de error y helper text
 */
const FormTextField: React.FC<FormTextFieldProps> = ({ formik, name, ...props }) => {
  const touched = formik.touched[name];
  const error = formik.errors[name];
  const showError = Boolean(touched && error);

  return (
    <TextField
      {...props}
      {...formik.getFieldProps(name)}
      error={showError}
      helperText={showError && typeof error === "string" ? error : undefined}
    />
  );
};

export default FormTextField;