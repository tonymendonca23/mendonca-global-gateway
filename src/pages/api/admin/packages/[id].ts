import type { APIRoute } from 'astro';
import db from '../../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  // Check auth
  if (!locals.staff) {
    return new Response('Unauthorized', { status: 401 });
  }

  const packageId = params.id;

  if (!packageId) {
    return new Response('Package ID required', { status: 400 });
  }

  // Get package details
  const result = await db.execute({
    sql: `
      SELECT p.*, u.email as customer_email, u.name as customer_name
      FROM packages p
      LEFT JOIN users u ON p.customer_id = u.id
      WHERE p.id = ?
    `,
    args: [packageId],
  });

  const pkg = result.rows[0] as any;

  if (!pkg) {
    return new Response('Package not found', { status: 404 });
  }

  // Return edit form HTML for HTMX
  const html = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-bold text-gray-900">Edit Package</h2>
        <button 
          onclick="document.getElementById('modal').classList.add('hidden')"
          class="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="text-sm text-gray-500">Tracking Number</div>
        <div class="font-mono font-bold text-primary">${pkg.original_tracking_number || pkg.mgg_tracking_number || ''
    }</div>
      </div>
      
      <div class="mb-4 p-3 bg-gray-50 rounded-lg">
        <div class="text-sm text-gray-500">Customer</div>
        <div class="font-medium">${pkg.customer_name || 'Unknown'}</div>
        <div class="text-sm text-gray-500">${pkg.customer_email}</div>
      </div>
      
      <form 
        hx-patch="/api/admin/packages/${packageId}" 
        hx-target="this"
        hx-swap="outerHTML"
        class="space-y-4"
      >
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select name="status" class="input w-full" required>
            <option value="at_warehouse" ${pkg.status === 'at_warehouse' ? 'selected' : ''}>📦 At US Warehouse</option>
            <option value="in_transit" ${pkg.status === 'in_transit' ? 'selected' : ''}>✈️ In Transit</option>
            <option value="customs" ${pkg.status === 'customs' ? 'selected' : ''}>📋 Customs Clearance</option>
            <option value="ready" ${pkg.status === 'ready' ? 'selected' : ''}>✅ Ready for Pickup</option>
            <option value="picked_up" ${pkg.status === 'picked_up' ? 'selected' : ''}>📦 Picked Up</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
          <input 
            type="number" 
            name="weight_lbs" 
            value="${pkg.weight_lbs || ''}" 
            step="0.1"
            class="input w-full"
            placeholder="Enter weight"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Value (USD)</label>
          <input 
            type="number" 
            name="value_usd" 
            value="${pkg.value_usd || ''}" 
            step="0.01"
            class="input w-full"
            placeholder="Enter value"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Customs Duty ($)</label>
          <input 
            type="number" 
            name="duty_usd" 
            value="${pkg.duty_usd || ''}" 
            step="0.01"
            class="input w-full"
            placeholder="Enter duty amount"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea 
            name="notes" 
            class="input w-full"
            rows="2"
            placeholder="Add notes about this package"
          >${pkg.notes || ''}</textarea>
        </div>
        
        <div class="flex gap-3 pt-4">
          <button type="submit" class="btn-primary flex-1">
            Save Changes
          </button>
          <button 
            type="button"
            onclick="document.getElementById('modal').classList.add('hidden')"
            class="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const PATCH: APIRoute = async ({ params, request, locals }) => {
  // Check auth
  if (!locals.staff) {
    return new Response('Unauthorized', { status: 401 });
  }

  const packageId = params.id;

  if (!packageId) {
    return new Response('Package ID required', { status: 400 });
  }

  try {
    const formData = await request.formData();
    const status = formData.get('status')?.toString() || 'at_warehouse';
    const weightLbs = formData.get('weight_lbs')?.toString();
    const valueUsd = formData.get('value_usd')?.toString();
    const dutyUsd = formData.get('duty_usd')?.toString();
    const notes = formData.get('notes')?.toString();

    // Validate status
    const validStatuses = ['at_warehouse', 'in_transit', 'customs', 'ready', 'picked_up'];
    if (!validStatuses.includes(status)) {
      const errorHtml = `
        <div class="p-6">
          <div class="text-5xl mb-4 text-center">❌</div>
          <h3 class="text-xl font-bold text-gray-900 mb-2 text-center">Invalid Status</h3>
          <p class="text-gray-500 mb-4 text-center">The selected status is not valid.</p>
          <button 
            onclick="document.getElementById('modal').classList.add('hidden')"
            class="btn-secondary w-full"
          >
            Close
          </button>
        </div>
      `;
      return new Response(errorHtml, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Get current package to check if status changed and get customer email
    const currentPkgResult = await db.execute({
      sql: `
        SELECT p.*, u.email as customer_email, u.name as customer_name
        FROM packages p
        LEFT JOIN users u ON p.customer_id = u.id
        WHERE p.id = ?
      `,
      args: [packageId]
    });
    const currentPkg = currentPkgResult.rows[0] as any;

    if (!currentPkg) {
      const errorHtml = `
        <div class="p-6">
          <div class="text-5xl mb-4 text-center">❌</div>
          <h3 class="text-xl font-bold text-gray-900 mb-2 text-center">Package Not Found</h3>
          <p class="text-gray-500 mb-4 text-center">The package you're trying to update doesn't exist.</p>
          <button 
            onclick="document.getElementById('modal').classList.add('hidden')"
            class="btn-secondary w-full"
          >
            Close
          </button>
        </div>
      `;
      return new Response(errorHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    // Update package
    // First, determine the received_at value based on status change
    let receivedAtValue: number | null = currentPkg.received_at;
    const oldStatus = currentPkg.status;

    if (oldStatus !== 'at_warehouse' && status === 'at_warehouse') {
      // Package is arriving at warehouse - set received_at to now
      receivedAtValue = Math.floor(Date.now() / 1000);
    } else if (oldStatus === 'at_warehouse' && status !== 'at_warehouse') {
      // Package is leaving warehouse - clear received_at
      receivedAtValue = null;
    }

    await db.execute({
      sql: `
        UPDATE packages 
        SET 
          status = ?,
          weight_lbs = ?,
          value_usd = ?,
          duty_usd = ?,
          notes = ?,
          status_updated_at = strftime('%s', 'now'),
          received_at = ?
        WHERE id = ?
      `,
      args: [
        status,
        weightLbs ? parseFloat(weightLbs) : null,
        valueUsd ? parseFloat(valueUsd) : null,
        dutyUsd ? parseFloat(dutyUsd) : null,
        notes || null,
        receivedAtValue,
        packageId,
      ],
    });

    // Check if we need to send a status update email
    if (currentPkg && currentPkg.status !== status && currentPkg.customer_email) {
      if (['at_warehouse', 'in_transit', 'customs'].includes(status)) {
        // Import dynamically to avoid circular dependencies if any
        const { sendPackageStatusEmail } = await import('../../../../lib/email');

        // Fire and forget email (don't block the request if email fails)
        sendPackageStatusEmail({
          email: currentPkg.customer_email,
          name: currentPkg.customer_name || 'Customer',
          trackingNumber: currentPkg.mgg_tracking_number,
          originalTracking: currentPkg.original_tracking_number,
          newStatus: status
        }).catch(err => console.error('Failed to send status email:', err));
      }
    }

    // Return success message
    const html = `
      <div class="p-6 text-center">
        <div class="text-5xl mb-4">✅</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2">Package Updated</h3>
        <p class="text-gray-500 mb-4">The package has been updated successfully.</p>
        <button 
          onclick="location.reload()"
          class="btn-primary"
        >
          Close & Refresh
        </button>
      </div>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error updating package:', error);

    const errorHtml = `
      <div class="p-6">
        <div class="text-5xl mb-4 text-center">❌</div>
        <h3 class="text-xl font-bold text-gray-900 mb-2 text-center">Update Failed</h3>
        <p class="text-gray-500 mb-4 text-center">There was an error updating the package. Please try again.</p>
        <div class="text-xs text-gray-400 mb-4 text-center">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </div>
        <button 
          onclick="document.getElementById('modal').classList.add('hidden')"
          class="btn-secondary w-full"
        >
          Close
        </button>
      </div>
    `;

    return new Response(errorHtml, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  // Check auth
  if (!locals.staff) {
    return new Response('Unauthorized', { status: 401 });
  }

  const packageId = params.id;

  if (!packageId) {
    return new Response('Package ID required', { status: 400 });
  }

  try {
    await db.execute({
      sql: 'DELETE FROM packages WHERE id = ?',
      args: [packageId],
    });

    return new Response('', { status: 200 });
  } catch (error) {
    return new Response('Error deleting package', { status: 500 });
  }
};
