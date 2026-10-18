import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiRequest, getErrorMessage } from "../api";
import LetterheadPrinter from "./LetterheadPrinter";
import "./ProfileSettings.css";

const LetterheadPage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // The designer pre-fills company details from the account profile.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await apiRequest("/account/profile/");
        if (!response.ok) throw new Error(await getErrorMessage(response));
        const data = await response.json();
        if (!cancelled) setProfile(data);
      } catch (error) {
        if (!cancelled) toast.error(error.message || "Failed to load company details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="loader">Loading letterhead...</div>;
  }

  return (
    <div className="profile-settings">
      <div className="page-header">
        <h2>Letterhead</h2>
      </div>

      <LetterheadPrinter profile={profile} />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default LetterheadPage;
