import matplotlib.pyplot as plt
import numpy as np

# Constants for nomograph (ported from nomograph.js)
CANVAS_WIDTH = 1200  # Original web canvas width in pixels
CANVAS_HEIGHT = 425  # Original web canvas height in pixels
MARGIN = 75  # Margin in pixels (will be scaled to inches)

# Nomograph scales (same as nomograph.js)
ENOB_MIN, ENOB_MAX = 1, 24  # bits
SNR_MIN, SNR_MAX = 6, 147  # dB
COUNTS_MIN, COUNTS_MAX = 2, 2**24  # counts
PERCENT_MIN, PERCENT_MAX = 0.000001, 50  # percent
POWERS_MIN, POWERS_MAX = -6, -1  # powers of 10
PPM_MIN, PPM_MAX = 0.01, 500000  # ppm
DVM_MIN, DVM_MAX = 1.5, 8  # DVM digits

# Print dimensions
USABLE_WIDTH_INCHES = 6.5  # Usable width in inches (specified)
ASPECT_RATIO = (CANVAS_WIDTH - 2 * MARGIN) / (CANVAS_HEIGHT - 2 * MARGIN)  # 1050 / 275
USABLE_HEIGHT_INCHES = USABLE_WIDTH_INCHES / ASPECT_RATIO  # ~1.702 inches
PIXELS_PER_INCH = 300  # 300 DPI for print
PIXELS_PER_WEB_PIXEL = (USABLE_WIDTH_INCHES * PIXELS_PER_INCH) / (CANVAS_WIDTH - 2 * MARGIN)  # Scaling factor
MARGIN_INCHES = MARGIN * PIXELS_PER_WEB_PIXEL / PIXELS_PER_INCH  # ~0.464 inches
BLEED_INCHES = 0.125  # Standard bleed area for print

# Total dimensions including margins and bleed
TOTAL_WIDTH_INCHES = USABLE_WIDTH_INCHES + 2 * MARGIN_INCHES + 2 * BLEED_INCHES  # ~7.678 inches
TOTAL_HEIGHT_INCHES = USABLE_HEIGHT_INCHES + 2 * MARGIN_INCHES + 2 * BLEED_INCHES  # ~2.88 inches

# Functions ported from nomograph.js
def value_to_x(value, min_val, max_val, is_log=True, reverse=False):
    nomograph_width = USABLE_WIDTH_INCHES
    if is_log:
        log_min = np.log10(min_val)
        log_max = np.log10(max_val)
        log_value = np.log10(value)
        t = (log_value - log_min) / (log_max - log_min)
    else:
        t = (value - min_val) / (max_val - min_val)
    if reverse:
        t = 1 - t
    return MARGIN_INCHES + BLEED_INCHES + t * nomograph_width

def db_to_x(db):
    return value_to_x(db, SNR_MIN, SNR_MAX, is_log=False, reverse=False)

def counts_to_db(counts):
    bits = np.log2(counts)
    return 6.02 * bits + 1.76

def bits_to_db(bits):
    return 6.02 * bits + 1.76

def percent_to_db(percent):
    counts = 100 / percent
    return counts_to_db(counts)

def ppm_to_db(ppm):
    percent = ppm / 10000
    return percent_to_db(percent)

def powers_to_db(power):
    percent = 100 * (10 ** power)
    return percent_to_db(percent)

def dvm_to_db(dvm):
    bits = dvm * 3.25
    return bits_to_db(bits)

# Create the nomograph using Matplotlib
fig, ax = plt.subplots(figsize=(TOTAL_WIDTH_INCHES, TOTAL_HEIGHT_INCHES), dpi=PIXELS_PER_INCH)

# Set up the plot
ax.set_xlim(0, TOTAL_WIDTH_INCHES)
ax.set_ylim(0, TOTAL_HEIGHT_INCHES)
ax.set_facecolor('white')
ax.axis('off')  # Hide axes for a clean look

# Calculate y-positions for each axis (4 axes), scaled to inches
axis_spacing = USABLE_HEIGHT_INCHES / 3
y_positions = [TOTAL_HEIGHT_INCHES - BLEED_INCHES - MARGIN_INCHES - i * axis_spacing for i in range(4)]

# Font size for print (smaller to prevent overlap)
FONT_SIZE = 6  # 6pt font for compact print layout

# Axis 1: DVM Digits (left, above)
dvm_y = y_positions[0]
ax.plot([MARGIN_INCHES + BLEED_INCHES, TOTAL_WIDTH_INCHES - MARGIN_INCHES - BLEED_INCHES], [dvm_y, dvm_y], color='black', linewidth=1)

# DVM Digits markers
dvm_markers = [3.5, 4.5, 5.5, 6.5]
for dvm in dvm_markers:
    db = dvm_to_db(dvm)
    x = db_to_x(db)
    ax.plot([x, x], [dvm_y - 0.03, dvm_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, dvm_y - 0.25, str(dvm), rotation=-90, verticalalignment='top', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, dvm_y, 'DVM Digits', verticalalignment='center', fontsize=FONT_SIZE)

# Axis 2: PPM (left, above) and Powers of Ten (left, below)
ppm_powers_y = y_positions[1]
ax.plot([MARGIN_INCHES + BLEED_INCHES, TOTAL_WIDTH_INCHES - MARGIN_INCHES - BLEED_INCHES], [ppm_powers_y, ppm_powers_y], color='black', linewidth=1)

# PPM markers (reduced density)
ppm_markers = [10000, 1000, 100, 10, 1, 0.1]  # Fewer markers to reduce overlap
for ppm in ppm_markers:
    db = ppm_to_db(ppm)
    x = db_to_x(db)
    ax.plot([x, x], [ppm_powers_y - 0.03, ppm_powers_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, ppm_powers_y - 0.15, str(ppm), rotation=-90, verticalalignment='bottom', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, ppm_powers_y - 0.05, 'PPM', verticalalignment='center', fontsize=FONT_SIZE)

# Powers of Ten markers
powers_markers = [-1, -2, -3, -4, -5, -6, -7]
for power in powers_markers:
    db = powers_to_db(power)
    x = db_to_x(db)
    ax.plot([x, x], [ppm_powers_y - 0.03, ppm_powers_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, ppm_powers_y + 0.15, str(power), rotation=-90, verticalalignment='top', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, ppm_powers_y + 0.05, 'Powers of Ten', verticalalignment='center', fontsize=FONT_SIZE)

# Axis 3: Percent (left, above) and Bits (left, below)
percent_bits_y = y_positions[2]
ax.plot([MARGIN_INCHES + BLEED_INCHES, TOTAL_WIDTH_INCHES - MARGIN_INCHES - BLEED_INCHES], [percent_bits_y, percent_bits_y], color='black', linewidth=1)

# Percent markers (reduced density)
percent_markers = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.01, 0.0001]
for percent in percent_markers:
    db = percent_to_db(percent)
    x = db_to_x(db)
    ax.plot([x, x], [percent_bits_y - 0.03, percent_bits_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, percent_bits_y - 0.15, f"{percent}%", rotation=-90, verticalalignment='bottom', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, percent_bits_y - 0.05, 'Percent', verticalalignment='center', fontsize=FONT_SIZE)

# Bits markers (every 2 bits to reduce overlap)
bits_markers = list(range(1, 25, 2))  # 1, 3, 5, ..., 23
for bits in bits_markers:
    db = bits_to_db(bits)
    x = db_to_x(db)
    ax.plot([x, x], [percent_bits_y - 0.03, percent_bits_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, percent_bits_y + 0.25, str(bits), rotation=-90, verticalalignment='bottom', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, percent_bits_y + 0.05, 'Bits', verticalalignment='center', fontsize=FONT_SIZE)

# Axis 4: dB (left, above) and Counts (left, below)
db_counts_y = y_positions[3]
ax.plot([MARGIN_INCHES + BLEED_INCHES, TOTAL_WIDTH_INCHES - MARGIN_INCHES - BLEED_INCHES], [db_counts_y, db_counts_y], color='black', linewidth=1)

# dB markers
db_markers = [10, 30, 50, 70, 90, 110, 130]  # Fewer markers to reduce overlap
for db in db_markers:
    x = db_to_x(db)
    ax.plot([x, x], [db_counts_y - 0.03, db_counts_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, db_counts_y - 0.25, str(db), rotation=-90, verticalalignment='top', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, db_counts_y - 0.05, 'dB', verticalalignment='center', fontsize=FONT_SIZE)

# Counts markers (corresponding to bits markers)
counts_markers = [2**bits for bits in bits_markers]
for counts in counts_markers:
    db = counts_to_db(counts)
    x = db_to_x(db)
    ax.plot([x, x], [db_counts_y - 0.03, db_counts_y + 0.03], color='black', linewidth=1)
    ax.text(x + 0.05, db_counts_y + 0.15, str(int(counts)), rotation=-90, verticalalignment='top', horizontalalignment='left', fontsize=FONT_SIZE)
ax.text(MARGIN_INCHES + BLEED_INCHES - 0.4, db_counts_y + 0.05, 'Counts', verticalalignment='center', fontsize=FONT_SIZE)

# Save the figure as a PNG for debugging
plt.savefig("nomograph_debug.png", dpi=PIXELS_PER_INCH, bbox_inches='tight', pad_inches=0)
print("Debug PNG generated: nomograph_debug.png")

# Save the figure directly as a PDF
pdf_filename = "accuracy_translator_nomograph.pdf"
plt.savefig(pdf_filename, format='pdf', dpi=PIXELS_PER_INCH, bbox_inches='tight', pad_inches=0)
plt.close()

print(f"PDF generated: {pdf_filename}")
print(f"Dimensions: {TOTAL_WIDTH_INCHES} x {TOTAL_HEIGHT_INCHES} inches (including bleed)")