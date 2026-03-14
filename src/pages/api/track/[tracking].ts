import type { APIRoute } from 'astro';
import db from '../../../lib/db';
import { PACKAGE_STATUS_LABELS, formatDate } from '../../../lib/utils';

export const GET: APIRoute = async ({ params }) => {
  const trackingNumber = params.tracking?.toUpperCase();

  if (!trackingNumber) {
    return new Response(JSON.stringify({ error: 'Tracking number required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await db.execute({
      sql: `SELECT 
              mgg_tracking_number,
              original_tracking_number,
              store_name,
              description,
              status,
              registered_at,
              received_at,
              status_updated_at,
              branch
            FROM packages 
            WHERE mgg_tracking_number = ?`,
      args: [trackingNumber],
    });

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({
        error: 'Tracking number not found. Please check and try again.'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const pkg = result.rows[0] as any;
    const statusInfo = PACKAGE_STATUS_LABELS[pkg.status as keyof typeof PACKAGE_STATUS_LABELS] || {
      label: pkg.status,
      icon: '📦',
      color: 'gray',
    };

    // Build status timeline
    const statusTimeline: Record<string, any> = {
      registered: {
        label: 'Registered',
        date: formatDate(pkg.registered_at),
        location: 'Online'
      },
    };

    if (pkg.status !== 'registered' && pkg.received_at) {
      statusTimeline.at_warehouse = {
        label: 'At US Warehouse',
        date: formatDate(pkg.received_at),
        location: 'New York, NY'
      };
    }

    // Add current status with date
    if (pkg.status !== 'registered') {
      statusTimeline[pkg.status] = {
        label: statusInfo.label,
        date: formatDate(pkg.status_updated_at),
        location: pkg.branch === 'mabaruma' ? 'Mabaruma, Guyana' : 'Georgetown, Guyana'
      };
    }

    return new Response(JSON.stringify({
      mgg_tracking_number: pkg.mgg_tracking_number,
      store_name: pkg.store_name,
      description: pkg.description,
      status: pkg.status,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      branch: pkg.branch,
      statusTimeline,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    ;
    return new Response(JSON.stringify({
      error: 'An error occurred. Please try again.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
