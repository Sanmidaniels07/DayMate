'use client';
import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useCallStore } from '@/stores/call';
import { CallSession } from '@/lib/webrtc';
import { useAnswerCall, useDeclineCall, useEndCall } from '@/hooks/use-calls';
import { BlobAvatar } from '@/components/ui/blob-avatar';

export function CallOverlay({ iceServers }: { iceServers: RTCIceServer[] }) {
  const { phase, call, isCaller, session, set, reset } = useCallStore();
  const answer = useAnswerCall();
  const decline = useDeclineCall();
  const end = useEndCall();
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const remoteAudio = useRef<HTMLAudioElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const peer = call?.initiator.profile;
  const isVideo = call?.type === 'VIDEO';

  // Attach the remote stream to whichever element exists, whenever it's ready.
  const attachRemote = (stream: MediaStream) => {
    remoteStreamRef.current = stream;
    if (remoteVideo.current) remoteVideo.current.srcObject = stream;
    if (remoteAudio.current) remoteAudio.current.srcObject = stream;
  };

  // Re-attach if the element mounts after the stream arrived (covers the timing race).
  useEffect(() => {
    if (remoteStreamRef.current) {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStreamRef.current;
      if (remoteAudio.current) remoteAudio.current.srcObject = remoteStreamRef.current;
    }
  }, [phase, isVideo]);

  useEffect(() => {
    if (!call || !isCaller || phase !== 'connecting' || session) return;
    (async () => {
      const s = new CallSession(call.id, iceServers, attachRemote,
        (state) => { if (state === 'connected') set({ phase: 'active' }); });
      await s.startLocalMedia(isVideo);
      set({ session: s });
      await s.makeOffer();
    })();
  }, [phase, isCaller, call, session, iceServers, isVideo, set]);

  const acceptCall = async () => {
    if (!call) return;
    await answer.mutateAsync(call.id);
    const s = new CallSession(call.id, iceServers, attachRemote,
      (state) => { if (state === 'connected') set({ phase: 'active' }); });
    await s.startLocalMedia(isVideo);
    set({ session: s, phase: 'connecting' });
  };

  const hangUp = async () => {
    if (call) await end.mutateAsync(call.id).catch(() => {});
    session?.hangup();
    reset();
  };
  const declineCall = async () => {
    if (call) await decline.mutateAsync(call.id).catch(() => {});
    reset();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-charcoal p-8 text-white">
      {/* Remote VIDEO — always mounted for video calls (not gated on phase) */}
      {isVideo && (
        <video ref={remoteVideo} autoPlay playsInline
          className={`absolute inset-0 size-full object-cover ${phase === 'active' ? '' : 'hidden'}`} />
      )}
      {/* Remote AUDIO sink — always mounted for voice calls (this was missing) */}
      {!isVideo && <audio ref={remoteAudio} autoPlay className="hidden" />}

      <div className="z-10 mt-16 flex flex-col items-center gap-4">
        {(!isVideo || phase !== 'active') && (
          <BlobAvatar name={peer?.displayName ?? '?'} tint={peer?.blobTint} avatarUrl={peer?.avatarUrl} size={112} />
        )}
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">{peer?.displayName ?? 'Calling…'}</p>
          <p className="mt-1 text-white/60">
            {phase === 'ringing-in' ? `Incoming ${isVideo ? 'video' : 'voice'} call`
              : phase === 'ringing-out' ? 'Ringing…'
              : phase === 'connecting' ? 'Connecting…'
              : phase === 'active' ? 'Connected'
              : phase === 'ended' ? 'Call ended' : ''}
          </p>
        </div>
      </div>

      <div className="z-10 mb-8 flex items-center gap-4">
        {phase === 'ringing-in' ? (
          <>
            <button onClick={declineCall} className="grid size-16 place-items-center rounded-full bg-[var(--danger)]">
              <PhoneOff size={26} />
            </button>
            <button onClick={acceptCall} className="grid size-16 place-items-center rounded-full bg-[var(--success)]">
              <Phone size={26} />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setMuted(!muted); session?.toggleAudio(muted); }}
              className="grid size-14 place-items-center rounded-full bg-white/15">
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            {isVideo && (
              <button onClick={() => { setVideoOff(!videoOff); session?.toggleVideo(videoOff); }}
                className="grid size-14 place-items-center rounded-full bg-white/15">
                {videoOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
            <button onClick={hangUp} className="grid size-16 place-items-center rounded-full bg-[var(--danger)]">
              <PhoneOff size={26} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}