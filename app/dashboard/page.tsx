import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase-config"
import { DashboardUI } from "./dashboard-ui"

export default async function Dashboard() {
  let displayName = "उपयोगकर्ता"

  if (isSupabaseConfigured()) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect("/login")
    displayName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "उपयोगकर्ता"
  } else {
    const cookieStore = cookies()
    const localUserCookie = cookieStore.get("nyay_local_user")
    if (!localUserCookie) return redirect("/login")
    try {
      const localUser = JSON.parse(decodeURIComponent(localUserCookie.value))
      displayName = localUser.name || localUser.email?.split("@")[0] || "उपयोगकर्ता"
    } catch {
      return redirect("/login")
    }
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
};
// ---

// --- Dashboard Component ---
export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();

  // --- State for data ---
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [lastChat, setLastChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ---

  // --- Fetch data on component mount ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      console.log("Fetching dashboard data...");

      // 1. Get User
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        console.error("Dashboard Auth Error:", authError);
        router.push("/login?message=Please log in to view the dashboard");
        return; // Stop fetching if not authenticated
      }
      setUser(currentUser);
      console.log("User fetched:", currentUser.id);

      // 2. Fetch Profile, Documents, Chat in parallel
      try {
        const [profileRes, documentsRes, chatRes] = await Promise.all([
          supabase
            .from("userProfile")
            .select("name")
            .eq("user_id", currentUser.id)
            .single(),
          supabase
            .from("documents")
            .select("id, name, status, created_at, user_id")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("chats")
            .select("last_message, updated_at")
            .eq("user_id", currentUser.id)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle() // Use maybeSingle to handle 0 or 1 row gracefully
        ]);

        // Handle Profile Response
        if (profileRes.error && profileRes.error.code !== "PGRST116") { // Ignore "No rows found"
          console.error("Error fetching user profile:", profileRes.error);
          // Set error state or use default name later
        } else {
            setUserProfile(profileRes.data);
            console.log("Profile fetched:", profileRes.data);
        }


        // Handle Documents Response
        if (documentsRes.error) {
          console.error("Error fetching documents:", documentsRes.error);
          setError("Failed to load documents.");
          setDocuments([]);
        } else {
            setDocuments(documentsRes.data || []);
             console.log("Documents fetched:", documentsRes.data);
        }

        // Handle Chat Response
        if (chatRes.error && chatRes.error.code !== "PGRST116") { // Ignore "No rows found"
          console.error("Error fetching last chat:", chatRes.error);
           // Optionally set an error state specific to chat
        } else {
             setLastChat(chatRes.data);
              console.log("Last chat fetched:", chatRes.data);
        }

      } catch (fetchError: any) {
        console.error("Error fetching dashboard data:", fetchError);
        setError("An error occurred while loading dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
        console.log("Finished fetching data.");
      }
    };

    fetchData();
  }, [supabase, router]);
  // --- End data fetching ---


  // --- Calculate Stats ---
  // Define allowed analyzed statuses explicitly (keep as is)
  const analyzedStatuses = ["विश्लेषित", "analyzed", "complete", "Analyzed"]; // Added "Analyzed"
  const processingStatuses = ["प्रगति में", "processing", "uploading"];
  const errorStatuses = ["त्रुटि", "error"];

  const calculateStats = (docs: Document[]) => {
    const totalDocs = docs.length;
    const analyzedCount = docs.filter((d) =>
        analyzedStatuses.includes(d.status?.toLowerCase() ?? "")
    ).length;
    const processingCount = docs.filter((d) =>
        processingStatuses.includes(d.status?.toLowerCase() ?? "")
    ).length;
    const requiresAttentionCount = docs.filter((d) =>
        errorStatuses.includes(d.status?.toLowerCase() ?? "")
    ).length;

    return [
      { id: 'tour-stats-total', label: "कुल दस्तावेज़", value: totalDocs, IconComponent: FileText, color: "text-blue-600 bg-blue-100" }, // <-- ADDED ID
      { id: 'tour-stats-analyzed', label: "विश्लेषित", value: analyzedCount, IconComponent: CheckCircle, color: "text-green-600 bg-green-100" },
      { id: 'tour-stats-processing', label: "प्रगति में", value: processingCount, IconComponent: Clock, color: "text-yellow-600 bg-yellow-100" },
      { id: 'tour-stats-attention', label: "ध्यान दें", value: requiresAttentionCount, IconComponent: AlertTriangle, color: "text-red-600 bg-red-100" },
    ];
  };
  const stats = calculateStats(documents);
  // ---

  // --- Quick Actions Definition (keep as is) ---
  const quickActions = [
    { id: 'tour-quick-upload', label: "नया दस्तावेज़ अपलोड करें", href: "/upload", IconComponent: Upload }, // <-- ADDED ID (example)
    { id: 'tour-quick-chat', label: "AI सहायक से पूछें", href: "/chat", IconComponent: MessageSquare }, // <-- ADDED ID (example)
    { id: 'tour-quick-consult', label: "परामर्श बुक करें", href: "/consultation", IconComponent: Briefcase }, // <-- ADDED ID (example)
  ];
  // ---

  // --- Loading State ---
   if (isLoading) {
       return (
         <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-green-50/30 via-blue-50/30 to-purple-50/30">
           <Loader2 className="h-10 w-10 animate-spin text-primary" />
         </div>
       );
     }
  // ---

   // --- Error State ---
   if (error) {
     return (
       <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-red-50 p-6">
         <Card className="w-full max-w-md border-red-200">
             <CardHeader className="items-center text-center">
                 <AlertTriangle className="h-10 w-10 text-destructive mb-3"/>
                 <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
             </CardHeader>
             <CardContent className="text-center">
                 <p className="text-red-700 mb-4">{error}</p>
                 <Button onClick={() => window.location.reload()}>Try Again</Button>
             </CardContent>
         </Card>
       </div>
     );
   }
   // ---

   // --- Authentication Fallback (Should ideally be handled by useEffect redirect) ---
    if (!user) {
        // This is a fallback, the redirect in useEffect should handle this
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
                <p>Redirecting to login...</p>
            </div>
        );
    }
  // ---

  // Get user's display name and initials
  const displayName = userProfile?.name || user.email?.split("@")[0] || "User";
  const userInitials = getInitials(userProfile?.name, user.email);

  return <DashboardUI displayName={displayName} />
}
