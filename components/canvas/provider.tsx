"use client"
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useMemo, useState } from "react";
import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import { Toaster } from "../ui/sonner";

type NodeHistory = {
    past: Node[][];
    present: Node[];
    future: Node[][];
};

type EdgeHistory = {
    past: Edge[][];
    present: Edge[];
    future: Edge[][];
};

type NodesContextType = {
    nodeHistory: NodeHistory;
    setNodeHistory: Dispatch<SetStateAction<NodeHistory>>;
    edgeHistory: EdgeHistory;
    setEdgeHistory: Dispatch<SetStateAction<EdgeHistory>>;
    rfInstance: ReactFlowInstance<Node, Edge> | null;
    setRfInstance: Dispatch<SetStateAction<ReactFlowInstance<Node, Edge> | null>>;
};

const initialNodes: Node[] = [];

const initialNodeHistory: NodeHistory = {
    past: [],
    present: initialNodes,
    future: [],
};

const initialEdgeHistory: EdgeHistory = {
    past: [],
    present: [],
    future: [],
};

export const NodesContext = createContext<NodesContextType>({
    nodeHistory: initialNodeHistory,
    setNodeHistory: () => { },
    edgeHistory: initialEdgeHistory,
    setEdgeHistory: () => { },
    rfInstance: null,
    setRfInstance: () => { },
});

export const NodesProvider = ({ children }: { children: React.ReactNode }) => {
    const [nodeHistory, setNodeHistory] = useState(initialNodeHistory);
    const [edgeHistory, setEdgeHistory] = useState(initialEdgeHistory);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, Edge> | null>(null);

    useEffect(() => {
        // console.log(nodeHistory);

        // setNodes((nodeHistory.present))
    }, [nodeHistory])


    const value = useMemo(() => ({ nodeHistory, setNodeHistory, edgeHistory, setEdgeHistory, rfInstance, setRfInstance }),
        [nodeHistory, edgeHistory, rfInstance, setRfInstance]);

    return <NodesContext.Provider value={value}>
        {children}
        <Toaster />

    </NodesContext.Provider>
}

export const useNodesContext = () => {
    const context = useContext(NodesContext);
    if (!context) {
        throw new Error('useNodesContext must be used within a NodesProvider');
    }
    return context;
}
