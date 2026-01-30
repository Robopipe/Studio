import { AppDispatch } from "@/store/types";
import { useDispatch, useSelector } from "react-redux";

export const useAppDispatch = useDispatch<AppDispatch>;
export const useAppSelector = useSelector;
