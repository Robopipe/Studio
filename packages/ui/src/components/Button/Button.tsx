import {
  Button as MuiButton,
  ButtonProps as MuiButtonProps,
} from "@mui/material";

export interface ButtonProps extends MuiButtonProps {
  variant?: "text" | "outlined" | "contained";
}

export const Button = ({ variant = "contained", ...props }: ButtonProps) => {
  return <MuiButton variant={variant} {...props} />;
};
