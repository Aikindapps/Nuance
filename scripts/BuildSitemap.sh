#!/bin/bash

# Read data from url-list.txt
data=$(cat scripts/url-list.txt)

# Remove unwanted characters and format URLs, one per line
cleaned_data=$(echo -e "$data" | tr -d '",' )


# Write cleaned data back to a temporary file
echo "$cleaned_data" > scripts/temp-url-list.txt

# Check if sitemap.xml exists, if so delete it
if [ -f src/SEO/sitemap.xml ]; then
  rm src/SEO/sitemap.xml
fi 

# Check if url-list.txt exists
if [ ! -f scripts/temp-url-list.txt ]; then
  echo "need to create url-list.txt file"
  exit 1
fi

# Create sitemap.xml file
touch src/SEO/sitemap.xml

# Add XML header to the file
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" >> src/SEO/sitemap.xml

# Loop through the list of URLs and add each URL to the sitemap.xml file
while read -r line; do
  echo "  <url>" >> src/SEO/sitemap.xml
  echo "    <loc>https://nuance.xyz$line</loc>" >> src/SEO/sitemap.xml
  echo "    <lastmod>"$(date +%Y-%m-%d)"</lastmod>" >> src/SEO/sitemap.xml
  echo "  </url>" >> src/SEO/sitemap.xml
done < scripts/temp-url-list.txt

# Add XML footer to the file
echo "</urlset>" >> src/SEO/sitemap.xml

# Delete the temporary file
rm scripts/temp-url-list.txt

# Confirm sitemap.xml file created
echo "sitemap.xml file created"
