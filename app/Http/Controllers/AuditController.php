<?php

namespace App\Http\Controllers;

use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): Response
    {
        $events = $this->audit->getEventsForUser($request->user()->id);

        return Inertia::render('Audit', ['events' => $events]);
    }
}
