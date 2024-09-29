"use client"
import { CircleAlert, X } from "lucide-react";
import { Handle, Node, NodeProps, NodeResizer, Position, useReactFlow } from "@xyflow/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { useNodesContext } from "./provider";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { useKeyPress } from '@xyflow/react';


const flowKey = 'example-flow';

type CustomNode = NodeProps & { data: { amount: string, label: string } }

const PaymentNodeBase = ({ data: { amount, label }, id, selected, width, height }: CustomNode) => {
    const { deleteElements } = useReactFlow();

    const onClick = useCallback(() => {
        deleteElements({ nodes: [{ id }] });
    }, [id, deleteElements]);


    return (
        <div style={{ width, height }} className={`border rounded-full bg-background flex items-center justify-between px-2 overflow-hidden py-1 text-xs 
        ${selected ? 'shadow-md' : ''} `}>
            <Handle
                type="target"
                position={Position.Left}
                style={{ left: -8, top: '50%', transform: 'translateY(-50%)' }}
            />
            <span>{label} {amount}</span>
            <X
                className="cursor-pointer text-foreground/[.5] hover:text-foreground"
                onClick={onClick}
                size={9}
            />
            <NodeResizer
                lineStyle={{ opacity: .2 }}
                color="#9b9b9b"
                isVisible={selected}
                minWidth={100}
                minHeight={30}

            />
        </div>
    );
}

export const PaypalNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Paypal', amount: '' }} />;
export const GooglePayNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Google Pay', amount: '' }} />;
export const StripeNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Stripe', amount: '' }} />;
export const ApplePayNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Apple Pay', amount: '' }} />;


export const PaymentInitializedNode = ({ data, id, selected, }: CustomNode) => {
    const { setNodeHistory, } = useNodesContext();
    return (
        <div className={`border rounded-full bg-background flex items-center justify-between px-2 py-1 text-xs relative w-[180px]`}>
            <CircleAlert size={12} className={`absolute ${parseInt(data.amount) < 100 ? 'hidden' : 'block text-red-500'} -top-1 fill-white right-[28px]`} />
            <Handle
                type="source"
                position={Position.Right}
                style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }}
            />
            <div className="p-3 flex flex-col gap-2 items-center w-full">
                <p className="font-medium text-xs">{data.label}</p>
                <Input size={8} type="text" value={data.amount}
                    onChange={((e: ChangeEvent<HTMLInputElement>) => {
                        setNodeHistory((prev) => ({
                            past: [...prev.past, prev.present],
                            present: prev.present.map((node) => node.id === id ? { ...node, data: { ...node.data, amount: Number(e.target.value) } } : node),
                            future: [],
                        }))
                    })} />
            </div>
        </div>
    );
};


export const CustomControls = () => {
    const { getNodes, setViewport } = useReactFlow();
    const { setNodeHistory, nodeHistory, setEdgeHistory, rfInstance } = useNodesContext();
    const MetaZPressed = useKeyPress(['Meta+z']);
    const MetaXPressed = useKeyPress(['Meta+x']);
    const MetaSPressed = useKeyPress(['Meta+s']);

    useEffect(() => {
        if (MetaZPressed) {
            handleUndo();
        }
        else if (MetaXPressed) {
            handleRedo();
        }
        else if (MetaSPressed) {
            onSave();
        }
    }, [MetaZPressed, MetaXPressed, MetaSPressed]);

    const handlePaymentMethodChange = (value: string) => {
        const alreadyExists = getNodes().some((node) => node.type === value);
        if (alreadyExists) {
            toast.error('Payment method already exists');
            return;
        }
        const node: Node = {
            id: uuidv4(),
            type: value,
            position: { x: Math.random() * 250, y: Math.random() * 100 },
            data: { amount: 100, label: value },
            width: 140,
            height: 30,
        }
        setNodeHistory((prev) => ({
            past: [...prev.past, prev.present],
            present: [...prev.present, node],
            future: [],
        }))
    }

    const handleUndo = () => {
        setNodeHistory((prev) => {
            const newHistory = {
                past: prev.past.slice(0, -1),
                present: prev.past[prev.past.length - 1],
                future: [prev.present, ...prev.future],
            };
            return newHistory;
        });
    }

    const handleRedo = () => {
        setNodeHistory((prev) => {
            const newHistory = {
                past: [...prev.past, prev.present],
                present: prev.future[0],
                future: prev.future.slice(1),
            };
            return newHistory;
        });
    }

    const handleInitializePayment = () => {
        const node: Node = {
            id: uuidv4(),
            type: 'paymentInitialized',
            position: { x: Math.random() * 250, y: Math.random() * 100 },
            data: { amount: 100, label: 'Payment Initialized' },
            width: 100,
            height: 30,
        }

        setNodeHistory((prev) => ({
            past: [...prev.past, prev.present],
            present: [...prev.present, node],
            future: [],
        }))
        // setPaymentInitialized(true);
    }

    const onSave = useCallback(() => {
        if (rfInstance) {
            const flow = rfInstance.toObject();
            localStorage.setItem(flowKey, JSON.stringify(flow));
            toast.success('Flow saved');
        }
    }, [rfInstance]);


    const onRestore = useCallback(() => {
        const restoreFlow = async () => {
            const flow = JSON.parse(localStorage.getItem(flowKey) ?? '[]');

            if (flow) {
                const { x = 0, y = 0, zoom = 1 } = flow.viewport;
                setNodeHistory((prev) => ({
                    past: [...prev.past, prev.present],
                    present: flow.nodes || [],
                    future: [],
                }))

                setEdgeHistory((prev) => ({
                    past: [...prev.past, prev.present],
                    present: flow.edges || [],
                    future: [],
                }))
                setViewport({ x, y, zoom });
            }
        };

        restoreFlow();
    }, [setNodeHistory, setViewport, setEdgeHistory]);


    return (<div className="w-full relative z-10 flex justify-center items-center mt-2 gap-2">
        <Button variant="outline" className="relative z-10 cursor-pointer" onClick={handleInitializePayment} >Initialize Payment</Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="relative z-10 cursor-pointer" >Add Payment Method</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuRadioGroup onValueChange={handlePaymentMethodChange} >
                    <DropdownMenuRadioItem value="paypal">
                        <span>Paypal</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="googlePay">
                        <span>Google Pay</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="stripe">
                        <span>Stripe</span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="applePay">
                        <span>Apple Pay</span>
                    </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" className="relative z-10 cursor-pointer flex items-center gap-1" disabled={nodeHistory.past.length === 0} onClick={handleUndo} >Undo node <span className="text-xs text-foreground/[.5]">⌘z</span> </Button>
        <Button variant="outline" className="relative z-10 cursor-pointer flex items-center gap-1" disabled={nodeHistory.future.length === 0} onClick={handleRedo} >Redo node <span className="text-xs text-foreground/[.5]">⌘x</span></Button>
        <Button variant="outline" className="relative z-10 cursor-pointer flex items-center gap-1" onClick={onSave} >Save <span className="text-xs text-foreground/[.5]">⌘s</span></Button>
        <Button variant="outline" className="relative z-10 cursor-pointer flex items-center gap-1" onClick={onRestore} >Restore</Button>
    </div>)
}