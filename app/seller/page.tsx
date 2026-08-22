import { SellerPortal, SellerSignIn } from "@/components/seller/SellerAccessExperience";
import { getSellerPortalData } from "@/lib/sellerPortalDatabase";
import { getSellerSession } from "@/lib/sellerSession";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const session = await getSellerSession();
  if (!session) return <SellerSignIn />;

  let data = null;
  try {
    data = await getSellerPortalData(session.sellerAccountId);
  } catch {
    data = null;
  }

  if (!data) return <SellerSignIn />;
  return <SellerPortal data={data} />;
}
