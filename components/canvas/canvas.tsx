"use client"
import { addEdge, applyNodeChanges, Background, Controls, Edge, OnConnect, OnEdgesChange, OnNodesChange, OnReconnect, ReactFlow, reconnectEdge, } from "@xyflow/react";
import { useCallback, useMemo, useRef, } from "react";
import { CustomControls, ApplePayNode, GooglePayNode, PaymentInitializedNode, PaypalNode, StripeNode } from "./nodes";
import '@xyflow/react/dist/style.css';
import { useNodesContext } from "./provider";
import { ModeToggle } from "../mode-toggle";


export const Canvas = () => {
    const { nodeHistory, setNodeHistory, edgeHistory, setEdgeHistory, setRfInstance } = useNodesContext()
    const edgeReconnectSuccessful = useRef(true);

    const nodeTypes = useMemo(() => ({
        paymentInitialized: PaymentInitializedNode,
        paypal: PaypalNode,
        googlePay: GooglePayNode,
        stripe: StripeNode,
        applePay: ApplePayNode,
    }), []);

    const onNodesChange: OnNodesChange = useCallback((changes) => {
        // new future condition
        console.log(changes, 'nodes changes');

        if (changes.every((change) => change.type === 'position' || change.type === 'remove')) {
            setNodeHistory((prev) => ({
                past: [...prev.past, prev.present],
                present: applyNodeChanges(changes, prev.present),
                future: [],
            }))
            return
        }

        setNodeHistory((prev) => ({
            past: prev.past,
            present: applyNodeChanges(changes, prev.present),
            future: prev.future,
        }))

    }, [setNodeHistory])

    const onEdgesChange: OnEdgesChange = useCallback((changes) => {
        // if 
        console.log(changes, 'edges changes');

        // setEdgeHistory((prev) => ({
        //     past: [...prev.past, prev.present],
        //     present: applyEdgeChanges(changes, prev.present),
        //     future: [],
        // }))
    }, [])

    const onReconnectStart = useCallback(() => {
        edgeReconnectSuccessful.current = false;
    }, []);

    const onReconnect: OnReconnect = useCallback((oldEdge, newConnection) => {
        edgeReconnectSuccessful.current = true;
        setEdgeHistory((prev) => {
            return {
                past: [...prev.past, prev.present],
                present: reconnectEdge(oldEdge, newConnection, prev.present),
                future: [],
            }
        })
    }, []);

    const onReconnectEnd = (event: MouseEvent | TouchEvent, edge: Edge,) => {
        if (!edgeReconnectSuccessful.current) {
            setEdgeHistory((prev) => {
                return {
                    past: prev.past,
                    present: prev.present.filter((e) => e.id !== edge.id),
                    future: [],
                }
            })
        }
        edgeReconnectSuccessful.current = true;
    }

    const onConnect: OnConnect = useCallback(
        (params) => {
            console.log(params, 'edge params')
            setEdgeHistory((prev) => {
                return {
                    past: [...prev.past, prev.present],
                    present: addEdge({ ...params, animated: true }, prev.present),
                    future: [],
                }
            })
        },
        [],
    );

    return (
        <div className="flex flex-col gap-4 items-center justify-center w-full">
            <div className="flex justify-end w-4/5">
                <ModeToggle />
            </div>
            <div className="flex justify-center items-center w-4/5 bg-primary-foreground h-[500px] border rounded-lg">
                <ReactFlow fitView
                    nodes={nodeHistory.present}
                    edges={edgeHistory.present}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onReconnectStart={onReconnectStart}
                    onReconnectEnd={onReconnectEnd}
                    onInit={(rfInstance) => setRfInstance(rfInstance)}
                >
                    <Background />
                    <Controls className="dark:text-foreground dark:hover:*:bg-muted dark:*:bg-background dark:*:border dark:*:border-border " />
                    <CustomControls />
                </ReactFlow>
            </div>
        </div>)
};
