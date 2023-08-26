#!/bin/bash

#used getPostUrl command at https://icscan.io/canister/qq4ni-qaaaa-aaaaf-qaalq-cai then saved to url-list.txt 
# bash ./scripts/BuildSitemap.sh



#TODO make this a part of the script
#dfx canister --network ic call Post getPostUrls > scripts/url-list.txt

#IFS=$'\n' read -d '' -r -a urls < scripts/url-list.txt

# Loop through the array of urls
#for url in "${urls[@]}"; do
  # Extract the necessary parts from the url using regex
  #if [[ $url =~ ^.*\/([0-9]+)\/(.*)$ ]]; then
    #id=${BASH_REMATCH[1]}
    #title=${BASH_REMATCH[2]}
    # Replace any spaces and hyphens with dashes
    #title=${title// /-}
    #title=${title//-/--}
    # Print the new formatted url
    #echo "/${id}/${title}"
  #fi
#done





if [ -f src/SEO/sitemap.xml ]; then
  echo "sitemap.xml file exists"
  rm src/SEO/sitemap.xml
  echo "sitemap.xml file deleted"
fi 

if [ ! -f scripts/url-list.txt ]; then
  echo "need to create url-list.txt file"
  exit 1
fi


# create sitemap.xml file
touch src/SEO/sitemap.xml

# add xml header to the file
# echo "<?xml version="1.0" encoding="UTF-8"?>" >> src/SEO/sitemap.xml consider adding this line back later for special characters in the url
echo "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" >> src/SEO/sitemap.xml

# loop through the list of URLs and add each URL to the sitemap.xml file
while read -r line; do
  echo "  <url>" >> src/SEO/sitemap.xml
  echo "    <loc>https://nuance.xyz$line</loc>" >> src/SEO/sitemap.xml
  echo "    <lastmod>"$(date +%Y-%m-%d)"</lastmod>" >> src/SEO/sitemap.xml
  echo "  </url>" >> src/SEO/sitemap.xml
done < scripts/url-list.txt

# add xml footer to the file
echo "</urlset>" >> src/SEO/sitemap.xml

# sitemap.xml file created
echo "sitemap.xml file created"