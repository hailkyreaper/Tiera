import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/admin";
import { getRecommendationOutcomesReport } from "@/lib/db/recommendation-outcomes";

export default async function RecommendationOutcomesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!(await isAdmin(supabase, user.id))) {
    notFound();
  }

  const rows = await getRecommendationOutcomesReport(supabase);
  const totalRecommendations = rows.reduce(
    (sum, row) => sum + row.recommendations,
    0,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-foreground">
          Recommendation Outcomes
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-world performance of recommendations, bucketed by the match %
          and shared-book count that justified showing them. &quot;Read&quot;
          means the viewer eventually ranked the book in one of their own
          tier lists — this app has no reading-status tracking, so that&apos;s
          the closest real signal to genuine engagement. The point: get real
          evidence for whether a higher match %/shared-book pairing actually
          produces recommendations people end up loving, before investing
          further in the matching algorithm.
        </p>
      </div>

      {totalRecommendations === 0 ? (
        <p className="text-sm text-muted-foreground">
          No recommendation data collected yet — this fills in as
          recommendations get shown and (eventually) ranked.
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-sm bg-card">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="px-4 py-3 font-medium">Match %</th>
              <th className="px-4 py-3 font-medium">Shared Books</th>
              <th className="px-4 py-3 font-medium">Recommendations</th>
              <th className="px-4 py-3 font-medium">Read</th>
              <th className="px-4 py-3 font-medium">Avg Final Tier</th>
              <th className="px-4 py-3 font-medium">S/A Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.matchRangeLabel}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 text-foreground">
                  {row.matchRangeLabel}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.sharedRangeLabel}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.recommendations}
                </td>
                <td className="px-4 py-3 text-foreground">{row.read}</td>
                <td className="px-4 py-3 text-foreground">
                  {row.avgFinalTier ?? "—"}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {row.saRate !== null ? `${row.saRate}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
