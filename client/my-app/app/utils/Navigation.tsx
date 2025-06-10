import { router } from "expo-router";

// Funcție pentru a naviga la profilul unui utilizator
export default function navigateToProfile(userId: string) {
if (userId) {
    router.push(`/users/${userId}` as any);
}
};