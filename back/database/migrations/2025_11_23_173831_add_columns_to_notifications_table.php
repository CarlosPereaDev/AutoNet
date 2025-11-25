<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->foreignId('user_id')->after('id')->constrained()->onDelete('cascade');
            $table->string('type', 50)->after('user_id'); // 'task_completed', 'task_started', 'vehicle_updated', 'machinery_updated', etc.
            $table->string('title')->after('type');
            $table->text('message')->after('title');
            $table->json('data')->nullable()->after('message'); // Datos adicionales (task_id, vehicle_id, etc.)
            $table->boolean('read')->default(false)->after('data');
            $table->timestamp('read_at')->nullable()->after('read');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn([
                'user_id',
                'type',
                'title',
                'message',
                'data',
                'read',
                'read_at'
            ]);
        });
    }
};
