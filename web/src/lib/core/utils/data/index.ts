export function generateRandom96BitBigInt() {
	// Create a 12-byte (96-bit) buffer
	const buffer = new Uint8Array(12);

	// Fill with cryptographically secure random values
	crypto.getRandomValues(buffer);

	// Convert to hex string (2 characters per byte)
	let hexString = '';
	buffer.forEach((byte) => {
		hexString += byte.toString(16).padStart(2, '0');
	});

	// Parse hex string to BigInt
	return BigInt('0x' + hexString);
}
