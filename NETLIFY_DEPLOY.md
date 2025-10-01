# Netlify Deployment Instructions

## Environment Variables Needed in Netlify:

1. Go to Netlify Dashboard > Site Settings > Environment Variables
2. Add these variables:

```
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_DATABASE_URL=your_database_url_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

## Deployment Steps:

1. Connect your repository to Netlify
2. Build settings are automatically configured via netlify.toml
3. Set environment variables in Netlify dashboard
4. Deploy!

## Build Information:

- Build Command: `npm run build`
- Publish Directory: `dist`
- Node Version: 18.x

## Features Included:

- ✅ PWA with offline support
- ✅ Firebase Authentication
- ✅ Firebase Realtime Database
- ✅ Google Login integration
- ✅ Responsive design
- ✅ Turkish language support
- ✅ Error boundaries
- ✅ Build optimization
- ✅ Chunk splitting for better performance