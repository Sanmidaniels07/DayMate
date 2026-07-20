'use client';
import { useEffect, useRef, useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Minimize2, Maximize2 } from 'lucide-react';
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
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const peer = call?.initiator.profile;
  const isVideo = call?.type === 'VIDEO';

  const attachRemote = (stream: MediaStream) => {
    remoteStreamRef.current = stream;
    if (remoteVideo.current) remoteVideo.current.srcObject = stream;
    if (remoteAudio.current) remoteAudio.current.srcObject = stream;
  };

  const captureLocal = (stream: MediaStream) => {
    localStreamRef.current = stream;
    if (localVideo.current) localVideo.current.srcObject = stream;
  };

  // Re-attach both streams whenever elements (re)mount — on phase change or minimize toggle.
  useEffect(() => {
    if (remoteStreamRef.current) {
      if (remoteVideo.current) remoteVideo.current.srcObject = remoteStreamRef.current;
      if (remoteAudio.current) remoteAudio.current.srcObject = remoteStreamRef.current;
    }
    if (localStreamRef.current && localVideo.current) {
      localVideo.current.srcObject = localStreamRef.current;
    }
  }, [phase, isVideo, minimized]);

  useEffect(() => {
    if (!call || !isCaller || phase !== 'connecting' || session) return;
    (async () => {
      const s = new CallSession(call.id, iceServers, attachRemote,
        (state) => { if (state === 'connected') set({ phase: 'active' }); });
      const local = await s.startLocalMedia(isVideo);
      captureLocal(local);
      set({ session: s });
      await s.makeOffer();
    })();
  }, [phase, isCaller, call, session, iceServers, isVideo, set]);

  const acceptCall = async () => {
    if (!call) return;
    await answer.mutateAsync(call.id);
    const s = new CallSession(call.id, iceServers, attachRemote,
      (state) => { if (state === 'connected') set({ phase: 'active' }); });
    const local = await s.startLocalMedia(isVideo);
    captureLocal(local);
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

  const statusText =
    phase === 'ringing-in' ? `Incoming ${isVideo ? 'video' : 'voice'} call`
    : phase === 'ringing-out' ? 'Ringing…'
    : phase === 'connecting' ? 'Connecting…'
    : phase === 'active' ? 'Connected'
    : phase === 'ended' ? 'Call ended' : '';

  // ---- Minimized floating widget ----
  if (minimized) {
    return (
      <>
        {/* Streams stay mounted (hidden) so media keeps flowing while minimized */}
        {isVideo && <video ref={remoteVideo} autoPlay playsInline className="hidden" />}
        {!isVideo && <audio ref={remoteAudio} autoPlay className="hidden" />}
        {isVideo && <video ref={localVideo} autoPlay playsInline muted className="hidden" />}

        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-24 right-4 z-[100] flex items-center gap-3 rounded-full bg-charcoal px-4 py-3 text-white shadow-[var(--shadow-float)] lg:bottom-6"
        >
          <BlobAvatar name={peer?.displayName ?? '?'} tint={peer?.blobTint} avatarUrl={peer?.avatarUrl} size={36} />
          <div className="text-left">
            <p className="text-[13px] font-semibold leading-tight">{peer?.displayName ?? 'Call'}</p>
            <p className="text-[11px] text-[var(--success)]">{phase === 'active' ? 'Ongoing' : statusText}</p>
          </div>
          <Maximize2 size={18} className="ml-1" />
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); hangUp(); }}
            className="ml-1 grid size-9 place-items-center rounded-full bg-[var(--danger)]"
          >
            <PhoneOff size={16} />
          </span>
        </button>
      </>
    );
  }

  // ---- Full overlay ----
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-charcoal p-8 text-white">
      {/* Remote video fills the screen */}
      {isVideo && (
        <video ref={remoteVideo} autoPlay playsInline
          className={`absolute inset-0 size-full object-cover ${phase === 'active' ? '' : 'hidden'}`} />
      )}
      {!isVideo && <audio ref={remoteAudio} autoPlay className="hidden" />}

      {/* Self-view PiP — small, mirrored, muted, top-right */}
      {isVideo && phase === 'active' && (
        <video
          ref={localVideo} autoPlay playsInline muted
          style={{ transform: 'scaleX(-1)' }}
          className={`absolute right-4 top-16 z-20 h-40 w-28 rounded-2xl border-2 border-white/20 object-cover shadow-lg sm:h-48 sm:w-32 ${videoOff ? 'hidden' : ''}`}
        />
      )}

      {/* Minimize button — top-left */}
      {(phase === 'active' || phase === 'connecting' || phase === 'ringing-out') && (
        <button
          onClick={() => setMinimized(true)}
          aria-label="Minimize call"
          className="absolute left-4 top-4 z-20 grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur"
        >
          <Minimize2 size={20} />
        </button>
      )}

      <div className="z-10 mt-16 flex flex-col items-center gap-4">
        {(!isVideo || phase !== 'active') && (
          <BlobAvatar name={peer?.displayName ?? '?'} tint={peer?.blobTint} avatarUrl={peer?.avatarUrl} size={112} />
        )}
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">{peer?.displayName ?? 'Calling…'}</p>
          <p className="mt-1 text-white/60">{statusText}</p>
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