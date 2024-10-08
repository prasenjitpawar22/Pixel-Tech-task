"use client"
import { CircleAlert, X } from "lucide-react";
import { Handle, Node, NodeProps, NodeResizer, Position, useReactFlow } from "@xyflow/react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';
import { ChangeEvent, createElement, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { useNodesContext } from "./provider";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { useKeyPress } from '@xyflow/react';
import { Icons } from "../icons";


const flowKey = 'example-flow';

type CustomNode = NodeProps & { data: { amount: string, label: string, icon: JSX.ElementType } }

const PaymentNodeBase = ({ data: { amount, label, icon }, id, selected, width, height }: CustomNode) => {
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
            {icon && createElement(icon, { className: 'w-4 h-4' })}
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

export const PaypalNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Paypal', amount: '', icon: Icons.paypal }} />;
export const GooglePayNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Google Pay', amount: '', icon: Icons.googlePay }} />;
export const StripeNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Stripe', amount: '', icon: Icons.stripe }} />;
export const ApplePayNode = (props: CustomNode) => <PaymentNodeBase {...props} data={{ label: 'Apple Pay', amount: '', icon: Icons.applePay }} />;


export const PaymentInitializedNode = ({ data, id }: CustomNode) => {
    const { setNodeHistory } = useNodesContext();
    return (
        <div className="border rounded-full bg-background flex items-center justify-between px-2 py-1 text-xs relative w-[180px]">
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
    const pPressed = useKeyPress(['p']);
    const sPressed = useKeyPress(['s']);
    const aPressed = useKeyPress(['a']);
    const gPressed = useKeyPress(['g']);

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
        else if (pPressed) {
            handlePaymentMethodChange('paypal');
        }
        else if (sPressed) {
            handlePaymentMethodChange('stripe');
        }
        else if (aPressed) {
            handlePaymentMethodChange('applePay');
        }
        else if (gPressed) {
            handlePaymentMethodChange('googlePay');
        }
    }, [MetaZPressed, MetaXPressed, MetaSPressed, pPressed, sPressed, aPressed, gPressed]);

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
        setNodeHistory((prev) => ({
            past: prev.past.slice(0, -1),
            present: prev.past[prev.past.length - 1],
            future: [prev.present, ...prev.future],
        }));
    }

    const handleRedo = () => {
        setNodeHistory((prev) => ({
            past: [...prev.past, prev.present],
            present: prev.future[0],
            future: prev.future.slice(1),
        }));
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
                    <DropdownMenuRadioItem value="paypal" className="flex items-center gap-2" >
                        <Icons.paypal className="w-4 h-4" />
                        <span>Paypal</span>
                        <DropdownMenuShortcut>P</DropdownMenuShortcut>
                    </DropdownMenuRadioItem >
                    <DropdownMenuRadioItem value="googlePay" className="flex items-center gap-2" >
                        <Icons.googlePay className="w-4 h-4" />
                        <span>Google Pay</span>
                        <DropdownMenuShortcut>G</DropdownMenuShortcut>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="stripe" className="flex items-center gap-2" >
                        <Icons.stripe className="w-4 h-4" />
                        <span>Stripe</span>
                        <DropdownMenuShortcut>S</DropdownMenuShortcut>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="applePay" className="flex items-center gap-2" >
                        <Icons.applePay className="w-4 h-4" />
                        <span>Apple Pay</span>
                        <DropdownMenuShortcut>A</DropdownMenuShortcut>
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