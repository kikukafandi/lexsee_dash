"use client";

import PushNotifTester from "@/components/features/testing/PushNotifTester";
import AiFeatureTester from "@/components/features/testing/AiFeatureTester";
import ApiTester from "@/components/features/testing/ApiTester";
import PlagiarismTester from "@/components/features/testing/PlagiarismTester";

export default function TestingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl text-textHigh">Testing Suite</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <PushNotifTester />
        <AiFeatureTester />
        <ApiTester />
        <PlagiarismTester />
      </div>
    </div>
  );
}
