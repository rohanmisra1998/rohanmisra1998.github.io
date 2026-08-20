import { useLayoutEffect, useRef } from 'react'
import { localAssistantAdapter } from '../../assistant/localAdapter'
import type { AssistantFeatureController } from '../../hooks/usePortfolioLayers'
import '../../styles/assistant.css'
import { AskRohan } from './AskRohan'
import type { AskRohanHandle } from './AskRohan'

interface AssistantFeatureProps {
  controller: AssistantFeatureController
}

function AssistantFeature({ controller }: AssistantFeatureProps) {
  const assistantRef = useRef<AskRohanHandle>(null)

  useLayoutEffect(() => {
    controller.attach(assistantRef.current)
    return () => controller.attach(null)
  }, [controller])

  return (
    <AskRohan
      ref={assistantRef}
      adapter={localAssistantAdapter}
      onLauncherRequest={controller.onRequestAssistant}
      onRequestCase={controller.onRequestCase}
      onViewChange={controller.onViewChange}
    />
  )
}

export default AssistantFeature
export type { AskRohanHandle } from './AskRohan'
