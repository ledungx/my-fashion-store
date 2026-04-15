import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import DraggableMenuList from '../../../components/DraggableMenuList';

const { Pool } = require('pg');

let prisma;
if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  if (!global.prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    global.prisma = new PrismaClient({ adapter });
  }
  prisma = global.prisma;
}

export const revalidate = 0;

export default async function AdminMenusPage({ searchParams }) {
    const params = await searchParams;
    const editId = params?.edit;

    const allMenus = await prisma.menuItem.findMany({
        orderBy: [
            { position: 'asc' },
            { order: 'asc' }
        ],
        include: { 
            children: { 
                orderBy: { order: 'asc' },
                include: { children: { orderBy: { order: 'asc' } } }
            } 
        }
    });
    
    // We only want top-level menus for the primary arrays, children are nested natively
    const topLevelMenus = allMenus.filter(m => !m.parentId);

    let editItem = null;
    if (editId) {
        // Find could be deep now, but findMany flat might be easier to search
        const flatMenus = await prisma.menuItem.findMany();
        editItem = flatMenus.find(m => m.id === editId);
    }

    const headerMenus = topLevelMenus.filter(m => m.position === 'HEADER');
    const footerMenus = topLevelMenus.filter(m => m.position === 'FOOTER');

    async function addMenuItem(formData) {
        'use server';
        const label = formData.get('label');
        const url = formData.get('url');
        const position = formData.get('position');
        const parentId = formData.get('parentId') || null;
        const isMegaMenu = formData.get('isMegaMenu') === 'on';
        const itemType = formData.get('itemType') || 'LINK';
        const imageUrl = formData.get('imageUrl') || null;
        const columns = parseInt(formData.get('columns') || '0', 10);
        
        const parentData = parentId ? { connect: { id: parentId } } : undefined;
        await prisma.menuItem.create({
            data: { label, url, position, isMegaMenu, itemType, imageUrl, columns, parent: parentData }
        });
        revalidatePath('/admin/menus');
        revalidatePath('/', 'layout');
    }
    
    async function updateMenuItem(formData) {
        'use server';
        const id = formData.get('id');
        const label = formData.get('label');
        const url = formData.get('url');
        const position = formData.get('position');
        const parentId = formData.get('parentId') || null;
        const isMegaMenu = formData.get('isMegaMenu') === 'on';
        const itemType = formData.get('itemType') || 'LINK';
        const imageUrl = formData.get('imageUrl') || null;
        const columns = parseInt(formData.get('columns') || '0', 10);
        
        const safeParentId = parentId === id ? null : parentId;
        const parentData = safeParentId ? { connect: { id: safeParentId } } : { disconnect: true };
        await prisma.menuItem.update({
            where: { id },
            data: { label, url, position, isMegaMenu, itemType, imageUrl, columns, parent: parentData }
        });
        revalidatePath('/admin/menus');
        revalidatePath('/', 'layout');
    }

    async function deleteMenuItem(formData) {
        'use server';
        const id = formData.get('id');
        await prisma.menuItem.deleteMany({ where: { parentId: id } });
        await prisma.menuItem.delete({ where: { id } });
        revalidatePath('/admin/menus');
        revalidatePath('/', 'layout');
    }

    async function handleReorder(orderedIds) {
        'use server';
        for (let i = 0; i < orderedIds.length; i++) {
            await prisma.menuItem.update({
                where: { id: orderedIds[i] },
                data: { order: i }
            });
        }
        revalidatePath('/admin/menus');
        revalidatePath('/', 'layout');
    }

    return (
        <div>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111' }}>Navigation Manager</h1>
                <p style={{ color: '#666' }}>Build your external facing navigation elements directly mapped securely. <strong>Drag and drop the stacked items below to instantly alter their sequence site-wide!</strong></p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 1.5fr)', gap: '40px' }}>
                {/* Creation / Edit Form */}
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', alignSelf: 'start' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>{editItem ? 'Edit Existing Link' : 'Add New Link'}</h3>
                    <form action={editItem ? updateMenuItem : addMenuItem} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {editItem && <input type="hidden" name="id" value={editItem.id} />}
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Label Text</label>
                            <input type="text" name="label" defaultValue={editItem?.label || ''} required placeholder="e.g., Summer Collection" style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }} />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Target URL</label>
                            <input type="text" name="url" defaultValue={editItem?.url || ''} required placeholder="e.g., /search?q=summer" style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Submenu Association (Optional)</label>
                            <select name="parentId" defaultValue={editItem?.parentId || ''} style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }}>
                                <option value="">Top Level (No Parent)</option>
                                <optgroup label="Header Top-Level">
                                    {topLevelMenus.filter(m => m.position === 'HEADER' && m.id !== editItem?.id).map(m => (
                                        <option key={m.id} value={m.id}>↳ {m.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Header Level 2 (For Mega Menus)">
                                    {allMenus.filter(m => m.parentId && m.position === 'HEADER' && m.id !== editItem?.id).map(m => (
                                        <option key={m.id} value={m.id}>---- ↳ {m.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Footer Top-Level">
                                    {topLevelMenus.filter(m => m.position === 'FOOTER' && m.id !== editItem?.id).map(m => (
                                        <option key={m.id} value={m.id}>↳ {m.label}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Footer Level 2">
                                    {allMenus.filter(m => m.parentId && m.position === 'FOOTER' && m.id !== editItem?.id).map(m => (
                                        <option key={m.id} value={m.id}>---- ↳ {m.label}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', border: '1px solid #eaeaea' }}>
                            <input type="checkbox" id="isMegaMenu" name="isMegaMenu" defaultChecked={editItem?.isMegaMenu} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            <label htmlFor="isMegaMenu" style={{ fontSize: '13px', fontWeight: 'bold', color: '#111', cursor: 'pointer', userSelect: 'none' }}>Enable visual Mega Menu (Category Dropdown)</label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Location Position</label>
                                <select name="position" defaultValue={editItem?.position || 'HEADER'} style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }}>
                                    <option value="HEADER">Main Header</option>
                                    <option value="FOOTER">Site Footer</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Item Type</label>
                                <select name="itemType" defaultValue={editItem?.itemType || 'LINK'} style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }}>
                                    <option value="LINK">Link / Text Column</option>
                                    <option value="IMAGE">Image Card</option>
                                </select>
                            </div>
                            <div style={{ width: '90px', flexShrink: 0 }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Columns <span style={{ color: '#aaa', fontWeight: 'normal' }}>(0=auto)</span></label>
                                <input type="number" name="columns" defaultValue={editItem?.columns ?? 0} min="0" max="12" style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px', textAlign: 'center' }} />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Image URL <span style={{ color: '#aaa', fontWeight: 'normal' }}>(only for Image Card type)</span></label>
                            <input type="text" name="imageUrl" defaultValue={editItem?.imageUrl || ''} placeholder="https://cdn.example.com/image.jpg" style={{ width: '100%', padding: '12px', border: '1px solid #eaeaea', borderRadius: '4px' }} />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                             <button type="submit" style={{ flex: 1, padding: '14px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
                                 {editItem ? 'Save Changes' : 'Publish Link'}
                             </button>
                             {editItem && (
                                 <Link href="/admin/menus" style={{ padding: '14px', backgroundColor: '#eaeaea', color: '#111', textAlign: 'center', textDecoration: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
                                     Cancel
                                 </Link>
                             )}
                        </div>
                    </form>
                </div>

                {/* Active Lists */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <DraggableMenuList 
                        title="Header Navigation" 
                        initialItems={headerMenus} 
                        onReorder={handleReorder} 
                        onDelete={deleteMenuItem} 
                    />
                    
                    <DraggableMenuList 
                        title="Footer Navigation" 
                        initialItems={footerMenus} 
                        onReorder={handleReorder} 
                        onDelete={deleteMenuItem} 
                    />
                </div>
            </div>
        </div>
    );
}
