---
title: Analyzing Web Logs with Azure Data Lake Analytics (ADLA)
date: 2016-01-24 16:00:41 -08:00
permalink: /2016/01/24/analyzing-web-logs-with-azure-data-lake-analytics-adla/
categories:
- Solution
tags:
- Big Data
---
<a href="http://vincentlauzon.com/2015/09/30/azure-data-lake-early-look/" target="_blank">Azure Data Lake</a> (both <a href="https://azure.microsoft.com/en-us/services/data-lake-store/" target="_blank">Storage</a> &amp; <a href="https://azure.microsoft.com/en-us/services/data-lake-analytics/" target="_blank">Analytics</a>) has been in public preview for a month or two.

You can get started by <a href="http://vincentlauzon.com/2016/01/03/azure-data-lake-analytics-quick-start/">reading this</a> or have a look at <a href="http://vincentlauzon.com/about/azure-data-lake/">Azure Data Lake series </a>for more posts on Azure Data Lake.

I thought I would kick some posts about more complex scenarios to display what’s possibile with that technology.

In this post I decided to analyse web logs at scale.  This is complementing the <a href="https://azure.microsoft.com/en-us/documentation/articles/data-lake-analytics-analyze-weblogs/" target="_blank">excellent documentation on how to read logs from one file</a>.  Here we’ll read through multiple log files.

Here I’m going to read web server logs (IIS logs) from an Azure Web sites.  I’ll suppose you have a web site and <a href="https://azure.microsoft.com/en-us/documentation/articles/web-sites-enable-diagnostic-log/" target="_blank">you configured web server logging on blob storage</a>.
<h2>Hooking on the blob storage</h2>
First thing to do, we’ll add a new data source to our ADLA account.  This will allow us to parse the files directly from the blob storage.

In the main pane of ADLA, click “Add Data Source”.

<a href="/assets/posts/2016/1/analyzing-web-logs-with-azure-data-lake-analytics-adla/image8.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/analyzing-web-logs-with-azure-data-lake-analytics-adla/image_thumb8.png" alt="image" width="1106" height="312" border="0" /></a>

In the “Add Data Source” pane, under “Storage Type”, select “Azure Storage”.

<a href="/assets/posts/2016/1/analyzing-web-logs-with-azure-data-lake-analytics-adla/image9.png"><img style="background-image:none;padding-top:0;padding-left:0;display:inline;padding-right:0;border:0;" title="image" src="/assets/posts/2016/1/analyzing-web-logs-with-azure-data-lake-analytics-adla/image_thumb9.png" alt="image" width="592" height="615" border="0" /></a>

Enter the storage account information of the storage account you are using in your web site to store your web server logs.

When done, click the “Add” button at the bottom.
<h2>Skipping line problem</h2>
Currently skipping lines in an input file isn’t supported.  This is quite unfortunate because log files come with two header rows:

```text

 
#Software: Microsoft Internet Information Services 8.0
#Fields: date time s-sitename cs-method cs-uri-stem cs-uri-query s-port cs-username c-ip cs(User-Agent) cs(Cookie) cs(Referer) cs-host sc-status sc-substatus sc-win32-status sc-bytes cs-bytes time-taken 
```

The obvious way to get around this would be to skip the first two lines.  You can see the feature is sort of there in the code documentation of Extractors but you’ll never be able to use it at this point (early January 2016).

<strong>This is a temporary shortcoming of the preview and will likely be fixed soon.</strong>

Because of this, we’ll have to jump through hoops and do some preprocessing.
<h2>Preprocessing Script</h2>
Let’s create a U-SQL script.  First, let’s load all the logs:

```sql

@lines =
    EXTRACT Line string,
            FileName string,
            Year string,
            Month string,
            Day string,
            Hour string
    FROM "wasb://@.blob.core.windows.net//{Year:*}/{Month:*}/{Day:*}/{Hour:*}/{FileName:*}"
    // Hack in order not to have the extractor delimitate columns
    USING Extractors.Text(delimiter : '$');
```

First notice that the file path starts with “wasb”.  This is because we aren’t targetting the default data source (the first one) of our ADLA account.  For secondary data sources, we need to specify the source using:
<ul>
	<li>For ADLS:  adl://&lt;Data LakeStorageAccountName&gt;.azuredatalakestore.net:443/Samples/Data/SearchLog.tsv</li>
	<li>For Azure Blob Storage:  wasb://&lt;BlobContainerName&gt;@&lt;StorageAccountName&gt;.blob.core.windows.net/Samples/Data/SearchLog.tsv</li>
</ul>
Instead of grabing just one file, we grab a <em>file set</em>.  You can read about he rules of how to define a <a href="https://msdn.microsoft.com/en-us/library/azure/mt621294.aspx" target="_blank">file set here</a>.

Finally, we use my good old trick to get the entire line without parsing columns.  If we would parse columns, it would break with the first 2 lines of each file as mentionned previously.

Then, we’ll filter out those header lines (starting with ‘#’) and reconstruct the blob path for future references:

```sql

@logLines =
    SELECT Line,
           "//" + Year + "/" + Month + "/" + Day + "/" + Hour + "/" + FileName AS BlobPath
    FROM @lines
    WHERE !Line.StartsWith("#");
```

In order to parse the lines, we’ll need some C# code:

```csharp

namespace MarvelUsql
{
    public static class SpaceSplit
    {
        public static string GetColumn(string line, int index)
        {
            var parts = line.Split(' ');
 
            if(index>= parts.Length)
            {
                throw new ArgumentOutOfRangeException(
                    "index", "Column " + index + " isn't available in line " + line);
            }
            else
            {
                return parts[index];
            }
        }
    }
}
```

Yes, I keep the old Marvel theme from the other posts.

We can put that code in the code behind of the script we are building.  This simplifies the compilation and <a href="http://vincentlauzon.com/2016/01/06/registering-assemblies-in-azure-data-lake-analytics/">assembly registration process</a>.  We can then leverage the custom code in our script:

```sql

@logs =
    SELECT DateTime.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 0)) AS s_date,
           MarvelUsql.SpaceSplit.GetColumn(Line, 1) AS s_time,
           MarvelUsql.SpaceSplit.GetColumn(Line, 2).ToUpper() AS s_sitename,
           MarvelUsql.SpaceSplit.GetColumn(Line, 3) AS cs_method,
           MarvelUsql.SpaceSplit.GetColumn(Line, 4) AS cs_uristem,
           MarvelUsql.SpaceSplit.GetColumn(Line, 5) AS cs_uriquery,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 6)) AS s_port,
           MarvelUsql.SpaceSplit.GetColumn(Line, 7) AS cs_username,
           MarvelUsql.SpaceSplit.GetColumn(Line, 8) AS c_ip,
           MarvelUsql.SpaceSplit.GetColumn(Line, 9) AS cs_useragent,
           MarvelUsql.SpaceSplit.GetColumn(Line, 10) AS cs_cookie,
           MarvelUsql.SpaceSplit.GetColumn(Line, 11) AS cs_referer,
           MarvelUsql.SpaceSplit.GetColumn(Line, 12) AS cs_host,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 13)) AS sc_status,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 14)) AS sc_substatus,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 15)) AS sc_win32status,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 16)) AS sc_bytes,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 17)) AS cs_bytes,
           int.Parse(MarvelUsql.SpaceSplit.GetColumn(Line, 18)) AS s_timetaken,
           BlobPath
    FROM @logLines;
```

Finally, we’ll output the result into a consolidated file:

```sql

OUTPUT @logs
TO "/Preprocess/Logs.log"
USING Outputters.Text(delimiter:' ');
```

This basically concludes the pre-processing of the logs.  We now have them all in one file.  The file might be huge, but thanks to ADLS no storage limit, that is ok.

We could also have stored the logs in a table, which would have accelerated future processing.  See <a href="http://vincentlauzon.com/2016/01/13/azure-data-lake-analytics-loading-files-with-custom-c-code/">this post</a> as an example of how to do that.
<h2>Popular Pages</h2>
Now that we’ve pre processed the logs, let’s run some analytics.

Let’s determine the most popular pages:

```sql

@logs =
    EXTRACT s_date DateTime,
            s_time string,
            s_sitename string,
            cs_method string,
            cs_uristem string,
            cs_uriquery string,
            s_port int,
            cs_username string,
            c_ip string,
            cs_useragent string,
            cs_cookie string,
            cs_referer string,
            cs_host string,
            sc_status int,
            sc_substatus int,
            sc_win32status int,
            sc_bytes int,
            cs_bytes int,
            s_timetaken int,
            BlobPath string
    FROM "/Preprocess/Logs.log"
    USING Extractors.Text(delimiter : ' ');
 
@popular =
    SELECT COUNT( * ) AS HitCount,
           s_sitename,
           cs_method,
           cs_uristem
    FROM @logs
    GROUP BY s_sitename,
             cs_method,
             cs_uristem
    ORDER BY HitCount DESC
    FETCH FIRST 10 ROWS ONLY;
 
OUTPUT @popular
TO "/Outputs/PopularPages.tsv"
USING Outputters.Tsv();
```

First query, we schema-on-read the aggregated logs we just created.

Second query, we aggregate the requests per pages, count them, sort the count and keep the top 10.

Third, we output that result to a TSV file.
<h2>Hit per day</h2>
Similarly, we can check the top days for traffic:

```sql

@logs =
    EXTRACT s_date DateTime,
            s_time string,
            s_sitename string,
            cs_method string,
            cs_uristem string,
            cs_uriquery string,
            s_port int,
            cs_username string,
            c_ip string,
            cs_useragent string,
            cs_cookie string,
            cs_referer string,
            cs_host string,
            sc_status int,
            sc_substatus int,
            sc_win32status int,
            sc_bytes int,
            cs_bytes int,
            s_timetaken int,
            BlobPath string
    FROM "/Preprocess/Logs.log"
    USING Extractors.Text(delimiter : ' ');
 
@perDay =
    SELECT COUNT( * ) AS HitCount,
           s_date
    FROM @logs
    GROUP BY s_date
    ORDER BY HitCount DESC
    FETCH FIRST 10 ROWS ONLY;
 
OUTPUT @perDay
TO "/Outputs/PagesPerDay.tsv"
USING Outputters.Tsv();
```

<h2>Conclusion</h2>
You can see how quickly we can ingest web server logs and do some simple analytics at scale.

The temporary shortcoming of not being able to schematise the files directly made the solution much more complicated.  With the skip-line feature we will be able to extract all files in one query and aggregate (or whatever analysis) on the second query.