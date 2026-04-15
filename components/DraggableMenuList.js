"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DraggableMenuList({ title, initialItems, onReorder, onDelete }) {
    const [items, setItems] = useState(initialItems);
    const [draggedIdx, setDraggedIdx] = useState(null);

    // Sync active arrays when server components remount (e.g. creating/deleting items)
    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    const onDragStart = (e, index) => {
        // Firefox requires dataTransfer data
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/html", e.currentTarget);
        }
        setDraggedIdx(index);
    };

    const onDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;

        const newItems = [...items];
        const draggedItem = newItems[draggedIdx];
        
        newItems.splice(draggedIdx, 1);
        newItems.splice(index, 0, draggedItem);
        
        setDraggedIdx(index);
        setItems(newItems);
    };

    const onDragEnd = async () => {
        setDraggedIdx(null);
        // Fire the NextJS Server Action bridging into PostgreSQL natively
        await onReorder(items.map(item => item.id));
    };

    return (
        <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', borderBottom: '1px solid #eaeaea', paddingBottom: '10px' }}>{title}</h3>
            {items.length === 0 ? <p style={{ color: '#888', fontSize: '14px' }}>No items added.</p> : (
                <ul style={{ listStyle: 'none', padding: '0 10px 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                    {items.map((m, idx) => (
                        <li 
                            key={m.id} 
                            draggable
                            onDragStart={(e) => onDragStart(e, idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDragEnd={onDragEnd}
                            style={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                backgroundColor: draggedIdx === idx ? '#f5f5f5' : '#f9f9f9', 
                                padding: '10px 15px', 
                                borderRadius: '4px', 
                                cursor: 'grab',
                                border: draggedIdx === idx ? '1px dashed #ccc' : '1px solid transparent',
                                transition: 'all 0.1s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ marginRight: '15px', color: '#ccc', fontSize: '16px', letterSpacing: '-2px', fontWeight: 'bold' }}>⋮⋮</span>
                                    <span style={{ fontSize: '14px' }}><strong>{m.label}</strong> <span style={{ color: '#888', fontSize: '12px', marginLeft: '10px' }}>{m.url}</span></span>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <Link href={`/admin/menus?edit=${m.id}`} style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold', fontSize: '12px' }}>EDIT</Link>
                                    <form action={onDelete} style={{ display: 'inline' }}>
                                        <input type="hidden" name="id" value={m.id} />
                                        <button type="submit" style={{ border: 'none', background: 'none', color: '#F05A5A', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>REMOVE</button>
                                    </form>
                                </div>
                            </div>

                            {/* Native Submenu Visualization inside List Nodes */}
                            {m.children && m.children.length > 0 && (
                                <ul style={{ listStyle: 'none', padding: '10px 0 0 45px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #eaeaea', marginTop: '10px' }}>
                                    {m.children.map(child => (
                                        <li key={child.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #eaeaea' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '13px' }}>↳ <strong>{child.label}</strong> <span style={{ color: '#888', fontSize: '11px', marginLeft: '10px' }}>{child.url}</span></span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                    <Link href={`/admin/menus?edit=${child.id}`} style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold', fontSize: '11px' }}>EDIT</Link>
                                                    <form action={onDelete} style={{ display: 'inline' }}>
                                                        <input type="hidden" name="id" value={child.id} />
                                                        <button type="submit" style={{ border: 'none', background: 'none', color: '#F05A5A', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>REMOVE</button>
                                                    </form>
                                                </div>
                                            </div>
                                            {/* Native Level 3 Visualization */}
                                            {child.children && child.children.length > 0 && (
                                                <ul style={{ listStyle: 'none', padding: '5px 0 0 25px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    {child.children.map(grandchild => (
                                                        <li key={grandchild.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fafafa', padding: '6px 12px', borderRadius: '4px', border: '1px solid #eee' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '12px' }}>---- ↳ <strong>{grandchild.label}</strong> <span style={{ color: '#aaa', fontSize: '10px', marginLeft: '10px' }}>{grandchild.url}</span></span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                                <Link href={`/admin/menus?edit=${grandchild.id}`} style={{ textDecoration: 'none', color: '#0066cc', fontWeight: 'bold', fontSize: '10px' }}>EDIT</Link>
                                                                <form action={onDelete} style={{ display: 'inline' }}>
                                                                    <input type="hidden" name="id" value={grandchild.id} />
                                                                    <button type="submit" style={{ border: 'none', background: 'none', color: '#F05A5A', cursor: 'pointer', fontWeight: 'bold', fontSize: '10px' }}>REMOVE</button>
                                                                </form>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
