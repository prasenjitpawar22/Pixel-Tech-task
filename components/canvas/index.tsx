import { ReactFlowProvider } from "@xyflow/react"
import { Canvas } from "./canvas"
import { NodesProvider } from "./provider"

export const ReactFlowCanvas = () => {
    return (
        <NodesProvider>
            <ReactFlowProvider>
                <Canvas />
            </ReactFlowProvider>
        </NodesProvider>
    )
}