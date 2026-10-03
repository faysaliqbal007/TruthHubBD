"use client";
import {useEffect, useRef, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {ThumbsDown, ThumbsUp} from 'lucide-react';
import {useAuth} from '../../features/auth/AuthContext';
import {formatNumber, localizedError} from '../../i18n/dictionary';
import {reactToReview, type ReviewReactionResult} from '../../services/reviews';
import type {ReviewReaction} from '../../types';
import './review-reactions.css';

type ReviewReactionsProps = {
  id: number; helpfulCount: number; notHelpfulCount?: number; viewerReaction?: ReviewReaction | null;
  canReact?: boolean; lang: 'en' | 'bn'; onChange?: (result: ReviewReactionResult) => void;
};

export function ReviewReactions(props: ReviewReactionsProps) {
  const {user} = useAuth();
  const location = useLocation();
  const signIn = '/login?next=' + encodeURIComponent(location.pathname + location.search + location.hash);
  // A different review or viewer owns a fresh component, including pending requests.
  return <ReviewReactionControls key={`${props.id}:${user?.id ?? 'guest'}`} {...props} viewerId={user?.id} signIn={signIn}/>;
}

function ReviewReactionControls({id, helpfulCount, notHelpfulCount = 0, viewerReaction = null, canReact = true, lang, onChange, viewerId, signIn}: ReviewReactionsProps & {viewerId?: number; signIn: string}) {
  const sourceKey = `${helpfulCount}:${notHelpfulCount}:${viewerReaction ?? 'none'}`;
  const [mutation, setMutation] = useState<{sourceKey: string; result: ReviewReactionResult}>();
  const result = mutation?.sourceKey === sourceKey ? mutation.result : {helpful_count: helpfulCount, not_helpful_count: notHelpfulCount, viewer_reaction: viewerId ? viewerReaction : null};
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const active = useRef(true);
  const latestSourceKey = useRef(sourceKey);
  useEffect(() => {
    latestSourceKey.current = sourceKey;
  }, [sourceKey]);
  useEffect(() => {
    active.current = true;
    return () => {active.current = false;};
  }, []);
  async function react(type: ReviewReaction) {
    if (!viewerId || !canReact || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const next = await reactToReview(id, type);
      if (!active.current) return;
      setMutation({sourceKey: latestSourceKey.current, result: next});
      onChange?.(next);
      setMessage(lang === 'bn' ? (next.viewer_reaction ? 'মতামত সংরক্ষিত হয়েছে।' : 'মতামত সরানো হয়েছে।') : (next.viewer_reaction ? 'Feedback saved.' : 'Feedback removed.'));
    } catch (error) {if (active.current) setMessage(localizedError((error as Error).message, lang));}
    finally {pending.current = false; if (active.current) setBusy(false);}
  }
  return <div className="review-reactions" aria-busy={busy}>
    <div className="review-reaction-buttons" role="group" aria-label={lang === 'bn' ? 'রিভিউ কতটা সহায়ক' : 'Review helpfulness'}>
      <button type="button" className="review-reaction" disabled={!viewerId || !canReact || busy} aria-pressed={!!viewerId && result.viewer_reaction === 'helpful'} onClick={() => void react('helpful')}><ThumbsUp size={15} aria-hidden="true"/><span>{lang === 'bn' ? 'সহায়ক' : 'Helpful'} <span className="review-reaction-count">{formatNumber(result.helpful_count, lang)}</span></span></button>
      <button type="button" className="review-reaction review-reaction-secondary" disabled={!viewerId || !canReact || busy} aria-pressed={!!viewerId && result.viewer_reaction === 'not_helpful'} onClick={() => void react('not_helpful')}><ThumbsDown size={15} aria-hidden="true"/><span>{lang === 'bn' ? 'সহায়ক নয়' : 'Not helpful'} <span className="review-reaction-count">{formatNumber(result.not_helpful_count, lang)}</span></span></button>
    </div>
    {!viewerId ? <Link className="review-reaction-signin" to={signIn}>{lang === 'bn' ? 'মতামত দিতে সাইন ইন করুন' : 'Sign in to react'}</Link> : !canReact ? <span className="review-reaction-hint">{lang === 'bn' ? 'নিজের রিভিউতে ভোট দেওয়া যায় না।' : 'You cannot vote on your own review.'}</span> : null}
    {message && <span className="review-reaction-hint" role="status">{message}</span>}
  </div>;
}
