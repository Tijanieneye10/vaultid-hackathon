<?php

namespace App\Http\Controllers;

use App\Models\ShareLink;
use App\Models\Verification;
use App\Services\ShareService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShareController extends Controller
{
    public function index(Request $request): Response
    {
        $links = $request->user()->shareLinks()->with('verification')
            ->orderByDesc('created_at')->get()
            ->map(fn (ShareLink $link) => [
                'id' => $link->id,
                'share_hash' => $link->share_hash,
                'url' => $link->url,
                'label' => $link->label,
                'is_active' => $link->is_active,
                'access_count' => $link->access_count,
                'last_accessed_at' => $link->last_accessed_at?->diffForHumans(),
                'created_at' => $link->created_at->diffForHumans(),
                'id_type' => $link->verification->id_type->shortLabel(),
            ]);

        return Inertia::render('Shares', ['links' => $links]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'verification_id' => 'required|uuid',
            'label' => 'nullable|string|max:255',
        ]);

        $verification = Verification::where('id', $request->verification_id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'verified')
            ->firstOrFail();

        app(ShareService::class)->generateHash(
            $request->user(), $verification, $request->label
        );

        return back()->with('success', 'Share link created!');
    }

    public function destroy(Request $request, ShareLink $shareLink): RedirectResponse
    {
        if ($shareLink->user_id !== $request->user()->id) {
            abort(403);
        }

        app(ShareService::class)->deactivate($shareLink);

        return back()->with('success', 'Share link deactivated.');
    }
}
