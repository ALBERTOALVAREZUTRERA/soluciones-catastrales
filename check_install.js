try {
    require.resolve('leaflet');
    console.log('Leaflet installed successfully');
    require.resolve('react-leaflet');
    console.log('React-Leaflet installed successfully');
} catch (e) {
    console.error('Package missing:', e.message);
    process.exit(1);
}
