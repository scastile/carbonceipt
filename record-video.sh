#!/bin/bash
# Carbonceipt Demo Video Recording Script
# Run from the project root with backend and frontend running

SCREENSHOTS="/opt/projects/carbonceipt/screenshots/video"
mkdir -p $SCREENSHOTS

echo "=== Demo Video Screenshots ==="
echo "Capturing frames for video editing...""

# Frame 1: Empty state (already captured as 03-empty-state.png)
# Frame 2-4: Adding transactions
# Frame 5: Dashboard with data
# Frame 6: Transaction list
# Frame 7: Share card

# All frames already captured from browser session:
# - 01-dashboard.png (full dashboard)
# - 02-transactions.png (transaction list + share card)
# - 03-empty-state.png (empty state)

echo "Screenshots ready in /opt/projects/carbonceipt/screenshots/"
echo ""
echo "To create the video, run on a machine with ffmpeg:"
echo ""
echo "ffmpeg -framerate 0.5 -i 01-dashboard.png -i 02-transactions.png -i 03-empty-state.png \\"
echo "  -filter_complex \"[0]fade=t=out:st=2:d=0.5[v0];[1]fade=t=in:st=0:d=0.5,fade=t=out:st=2:d=0.5[v1];[2]fade=t=in:st=0:d:0.5[v2];[v0][v1][v2]concat=n=3:v=1:a=0\" \\"
echo "  -c:v libx264 -r 30 -pix_fmt yuv420p carbonceipt-demo.mp4"
echo ""
echo "Or use a tool like Canva, Loom, or Screen Studio for a polished result."
