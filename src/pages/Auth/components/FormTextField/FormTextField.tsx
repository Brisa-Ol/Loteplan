// src/components/common/FormTextField/FormTextField.tsx

import React from "react";
import { TextField, type TextFieldProps } from "@mui/material";
import { type FormikProps, getIn } from "formik";

// Excluimos las props que maneja Formik para evitar conflictos de tipos
interface FormTextFieldProps extends Omit<TextFieldProps, "name" | "value" | "error" | "onChange" | "onBlur"> {
  formik: FormikProps<any>;
  name: string;
}

/**
 * TextField integrado con Formik y Material UI Theme.
 * * Características:
 * - Soporta nombres anidados (ej: "usuario.direccion") gracias a getIn.
 * - Gestiona automáticamente el estado 'error' y 'touched'.
 * - Preserva el helperText original si no hay error (útil para instrucciones).
 * - Hereda automáticamente los estilos del theme global (bordes redondeados, colores).
 */
const FormTextField: React.FC<FormTextFieldProps> = ({ 
  formik, 
  name, 
  helperText, 
  ...props 
}) => {
  // Obtenemos las props básicas (onChange, onBlur, value, checked)
  const field = formik.getFieldProps(name);

  // Usamos getIn para acceder de forma segura a objetos anidados
  const touched = getIn(formik.touched, name);
  const error = getIn(formik.errors, name);
  
  const showError = Boolean(touched && error);

  return (
    <TextField
      {...props}
      {...field}
      id={name} // Buena práctica para accesibilidad y testing
      error={showError}
      // Si hay error, muestra el error. Si no, muestra el helperText que pasaste como prop (si existe)
      helperText={showError ? (error as string) : helperText}
   
    />
  );
};

export default FormTextField;