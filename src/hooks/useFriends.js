import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabase } from "../utils/supabase.js";
import { showNotification } from "../utils/notifications.js";
import {
  fetchFriendData,
  sendFriendRequest,
  respondToRequest,
  removeFriendship,
} from "../utils/friends.js";

// useFriends — owns all friend state, realtime, and notifications.
//
// Mounted ONCE at the app level (not inside FriendsPage) so:
//   1. the nav badge can read the pending-request count, and
//   2. request/accept/decline notifications fire no matter which tab is open.
//
// Returns:
//   { loading, friends, incoming, outgoing, pendingCount,
//     sendRequest, accept, decline, unfriend, refresh }
export function useFriends(auth) {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(false);

  const myId = auth?.user?.id || null;
  const signedIn = auth?.status === "signed-in" && !!myId;

  // Snapshot of the last-seen friendships so realtime events can be classified
  // (new incoming request vs. a response to one of my outgoing requests)
  // without trusting the (RLS-filtered) payload to be complete.
  const seenRef = useRef({ incomingIds: new Set(), outgoingStatus: new Map() });

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !myId) {
      setData({ friends: [], incoming: [], outgoing: [] });
      return;
    }
    const next = await fetchFriendData(supabase, myId);
    setData(next);
    return next;
  }, [myId]);

  // Initial load whenever the signed-in identity changes.
  useEffect(() => {
    if (!signedIn) {
      setData({ friends: [], incoming: [], outgoing: [] });
      seenRef.current = { incomingIds: new Set(), outgoingStatus: new Map() };
      return;
    }
    let cancelled = false;
    setLoading(true);
    refresh().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [signedIn, refresh]);

  // Seed the "seen" snapshot the first time data arrives so we don't fire
  // notifications for pre-existing requests on load.
  const primedRef = useRef(false);
  useEffect(() => {
    if (!signedIn) {
      primedRef.current = false;
      return;
    }
    if (primedRef.current) return;
    // Only prime once the first fetch has populated (loading settled).
    if (loading) return;
    seenRef.current = {
      incomingIds: new Set(data.incoming.map((i) => i.friendship.id)),
      outgoingStatus: new Map(
        data.outgoing.map((o) => [o.friendship.id, o.friendship.status])
      ),
    };
    primedRef.current = true;
  }, [signedIn, loading, data]);

  // Realtime: any change to a friendship row I'm part of → refresh, then diff
  // against the seen snapshot to decide what (if anything) to notify.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !signedIn) return;

    const channel = supabase
      .channel(`friendships:${myId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        async () => {
          const next = await refresh();
          if (!next || !primedRef.current) return;
          notifyOnDiff(seenRef.current, next);
          // Update the snapshot after notifying.
          seenRef.current = {
            incomingIds: new Set(next.incoming.map((i) => i.friendship.id)),
            outgoingStatus: new Map(
              next.outgoing.map((o) => [o.friendship.id, o.friendship.status])
            ),
          };
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [signedIn, myId, refresh]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const sendRequest = useCallback(
    async (email) => {
      const supabase = getSupabase();
      if (!supabase || !myId) return { ok: false, error: "Sign in first." };
      const res = await sendFriendRequest(supabase, email, myId);
      if (res.ok) await refresh();
      return res;
    },
    [myId, refresh]
  );

  const accept = useCallback(
    async (id) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await respondToRequest(supabase, id, true);
      await refresh();
    },
    [refresh]
  );

  const decline = useCallback(
    async (id) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await respondToRequest(supabase, id, false);
      await refresh();
    },
    [refresh]
  );

  const unfriend = useCallback(
    async (id) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await removeFriendship(supabase, id);
      await refresh();
    },
    [refresh]
  );

  return {
    loading,
    friends: data.friends,
    incoming: data.incoming,
    outgoing: data.outgoing,
    // Badge = actionable items waiting on the user (incoming requests).
    pendingCount: data.incoming.length,
    sendRequest,
    accept,
    decline,
    unfriend,
    refresh,
  };
}

function nameFor(item) {
  return (
    item?.profile?.display_name ||
    item?.profile?.email ||
    "Someone"
  );
}

// Compare the previous seen snapshot with freshly-fetched data and fire one
// in-app/OS notification per meaningful change.
function notifyOnDiff(seen, next) {
  // New incoming requests.
  for (const item of next.incoming) {
    if (!seen.incomingIds.has(item.friendship.id)) {
      showNotification("New friend request", `${nameFor(item)} wants to connect on LifeOS.`, {
        tag: `friend-req-${item.friendship.id}`,
      });
    }
  }

  // Responses to my outgoing requests. An accepted request moves OUT of
  // `outgoing` and into `friends`, so look in both lists by id.
  const currentById = new Map();
  for (const item of next.outgoing) {
    currentById.set(item.friendship.id, item); // 'declined' or still 'pending'
  }
  for (const item of next.friends) {
    if (item.isRequester) currentById.set(item.friendship.id, item); // 'accepted'
  }

  for (const [id, prevStatus] of seen.outgoingStatus.entries()) {
    if (prevStatus !== "pending") continue;
    const item = currentById.get(id);
    if (!item) continue; // canceled/removed — nothing to announce
    const status = item.friendship.status;
    if (status === "accepted") {
      showNotification("Friend request accepted", `${nameFor(item)} accepted your request.`, {
        tag: `friend-acc-${id}`,
      });
    } else if (status === "declined") {
      showNotification("Friend request declined", `${nameFor(item)} declined your request.`, {
        tag: `friend-dec-${id}`,
      });
    }
  }
}
