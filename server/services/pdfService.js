/**
 * PDF Generator Service
 * Generates PDF itineraries for bookings
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateItineraryPDF = (booking, stream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
  });

  // Pipe PDF to stream
  doc.pipe(stream);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('Smart Travel', { align: 'center' });
  doc.fontSize(10).font('Helvetica').text('Your Complete Travel Companion', { align: 'center' });
  doc.moveDown(1);

  // Divider
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(0.5);

  // Title
  doc.fontSize(18).font('Helvetica-Bold').text('Travel Itinerary');
  doc.moveDown(1);

  // Booking Info Section
  doc.fontSize(12).font('Helvetica-Bold').text('Booking Information');
  doc.fontSize(10).font('Helvetica');

  const bookingInfo = [
    { label: 'Booking Reference:', value: booking.bookingReference || booking._id.slice(-8) },
    { label: 'Destination:', value: booking.destination },
    { label: 'Duration:', value: `${booking.duration} days` },
    { label: 'Departure Date:', value: new Date(booking.departureDate).toLocaleDateString() },
    { label: 'Travelers:', value: booking.travelers },
    { label: 'Budget:', value: `$${booking.budget}` },
    { label: 'Status:', value: booking.status },
  ];

  bookingInfo.forEach(info => {
    doc.text(`${info.label} `, { continued: true }).font('Helvetica-Bold').text(info.value);
    doc.font('Helvetica');
  });

  doc.moveDown(1);

  // Divider
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // Itinerary Section
  doc.fontSize(12).font('Helvetica-Bold').text('Daily Itinerary');
  doc.moveDown(0.5);

  if (booking.itinerary && Array.isArray(booking.itinerary)) {
    booking.itinerary.forEach((day, index) => {
      doc.fontSize(11).font('Helvetica-Bold').text(`Day ${day.day || index + 1}`, { underline: true });
      doc.fontSize(10).font('Helvetica');
      doc.text(day.title || `Day ${day.day || index + 1}`, { color: '0066cc' });

      if (day.destinations && Array.isArray(day.destinations)) {
        day.destinations.forEach(dest => {
          doc.text(`• ${dest.name} (${dest.city})`, { indent: 20 });
          if (dest.time) doc.text(`  Time: ${dest.time}`, { indent: 40, color: '666666' });
        });
      }

      if (day.meals) {
        doc.text(`Meals: ${day.meals}`, { indent: 20, color: '666666' });
      }

      if (day.accommodation) {
        doc.text(`Accommodation: ${day.accommodation}`, { indent: 20, color: '666666' });
      }

      if (day.totalDayCost) {
        doc.text(`Day Cost: $${day.totalDayCost}`, { indent: 20, color: '006600', font: 'Helvetica-Bold' });
      }

      doc.moveDown(0.5);
    });
  }

  doc.moveDown(1);

  // Divider
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
  doc.moveDown(1);

  // Summary Section
  doc.fontSize(12).font('Helvetica-Bold').text('Trip Summary');
  doc.fontSize(10).font('Helvetica');

  const totalCost = booking.budget || 0;
  const summary = [
    { label: 'Total Travelers:', value: booking.travelers },
    { label: 'Duration:', value: `${booking.duration} days` },
    { label: 'Total Budget:', value: `$${totalCost}` },
    { label: 'Per Person:', value: `$${Math.ceil(totalCost / booking.travelers)}` },
  ];

  summary.forEach(item => {
    doc.text(`${item.label} `, { continued: true }).font('Helvetica-Bold').text(item.value);
    doc.font('Helvetica');
  });

  doc.moveDown(2);

  // Footer
  doc.fontSize(9).font('Helvetica').fillColor('#999999').text(
    'Smart Travel - Your Complete Travel Companion | www.smarttravel.com',
    { align: 'center' }
  );
  doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, {
    align: 'center',
  });

  // Finalize PDF
  doc.end();
};

module.exports = {
  generateItineraryPDF,
};
