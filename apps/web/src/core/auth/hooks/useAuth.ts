import { useAppSelector } from "@/hooks";
import { selectAuth } from "../services";

export const useAuth = () => useAppSelector(selectAuth);
