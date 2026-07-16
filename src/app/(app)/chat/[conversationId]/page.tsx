'use client';
import { Suspense } from 'react';
import { use } from 'react';
import { ChatThread } from '../chat-thread';

function ThreadPageInner({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  
  
  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="fixed inset-0 bg-canvas lg:pl-24">
      <ChatThread conversationId={conversationId} onClose={handleClose} />
    </div>
  );
}

export default function ThreadPage({ params }: { params: Promise<{ conversationId: string }> }) {
  return (
    <Suspense fallback={null}>
      <ThreadPageInner params={params} />
    </Suspense>
  );
}