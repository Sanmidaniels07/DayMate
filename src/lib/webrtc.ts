import { getSocket, SocketEvents } from './socket';

/**
 * One active call's peer connection + media. The choreography:
 *  Caller: getUserMedia → createOffer → send offer → await answer → ICE flows
 *  Callee: receive offer → getUserMedia → createAnswer → send answer → ICE flows
 * All signaling rides CLIENT_CALL_SIGNAL / CALL_SIGNAL, opaque to the server.
 */
export class CallSession {
  pc: RTCPeerConnection;
  localStream: MediaStream | null = null;
  remoteStream = new MediaStream();

  constructor(
    private callId: string,
    iceServers: RTCIceServer[],
    private onRemoteTrack: (stream: MediaStream) => void,
    private onStateChange: (state: RTCPeerConnectionState) => void,
  ) {
    this.pc = new RTCPeerConnection({ iceServers });

    // Our ICE candidates → relay to the peer
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.signal({ kind: 'ice', candidate: e.candidate });
    };
    // The peer's tracks arrive → surface them
    this.pc.ontrack = (e) => {
      e.streams[0].getTracks().forEach((t) => this.remoteStream.addTrack(t));
      this.onRemoteTrack(this.remoteStream);
    };
    this.pc.onconnectionstatechange = () => this.onStateChange(this.pc.connectionState);
  }

  private signal(data: unknown) {
    getSocket()?.emit(SocketEvents.CLIENT_CALL_SIGNAL, { callId: this.callId, data });
  }

  async startLocalMedia(video: boolean) {
    this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    this.localStream.getTracks().forEach((t) => this.pc.addTrack(t, this.localStream!));
    return this.localStream;
  }

  /** Caller side. */
  async makeOffer() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.signal({ kind: 'offer', sdp: offer });
  }

  /** Handle a signaling blob relayed from the peer. */
  async handleSignal(data: { kind: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) {
    if (data.kind === 'offer' && data.sdp) {
      await this.pc.setRemoteDescription(data.sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.signal({ kind: 'answer', sdp: answer });
    } else if (data.kind === 'answer' && data.sdp) {
      await this.pc.setRemoteDescription(data.sdp);
    } else if (data.kind === 'ice' && data.candidate) {
      await this.pc.addIceCandidate(data.candidate).catch(() => {});
    }
  }

  toggleAudio(on: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = on));
  }
  toggleVideo(on: boolean) {
    this.localStream?.getVideoTracks().forEach((t) => (t.enabled = on));
  }

  hangup() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc.close();
  }
}