---
title:  Using Microsoft Graph API to interact with Azure AD
date:  01/31/2017 11:00:12
permalink:  "/2017/01/31/using-microsoft-graph-api-to-interact-with-azure-ad/"
categories:
- Solution
tags:
- Identity
- Security
---
<img style="background-image:none;float:right;padding-top:0;padding-left:0;display:inline;padding-right:0;border-width:0;" src="https://vincentlauzon.files.wordpress.com/2017/01/pexels-photo-898451.jpeg" width="224" height="240" align="right" border="0" />

In my <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank" rel="noopener">last article</a>, I showed how to authenticate on Azure AD using a user name / password without using the native web flow.

The underlying scenario was to migrate an application using an LDAP server by leveraging an Azure AD tenant.

The logical continuation of that scenario is to use the <a href="https://graph.microsoft.io/en-us/" target="_blank" rel="noopener">Microsoft Graph API</a> to interact with the tenant the same way we would use LDAP queries to interact with the LDAP server.

Microsoft Graph API is a generalization of the Azure AD Graph API and should be used instead.  It consists of simple REST queries which <a href="https://graph.microsoft.io/en-us/docs/overview/overview" target="_blank" rel="noopener">are all documented</a>.

In this scenario, I’ll consider three simple interactions:

<ul>
    <li>Testing if a user exists</li>
    <li>Returning the groups a user belong to</li>
    <li>Creating a new user</li>
</ul>

But first we need to setup the Azure AD tenant.

<h2>Azure AD setup</h2>

We’re going to rely on the <a href="https://vincentlauzon.com/2017/01/29/authenticating-to-azure-ad-non-interactively/" target="_blank" rel="noopener">last article</a> to do the heavy lifting.

We are going to create a new application (here we’re going to use the name “QueryingApp”) of type Web App / API (although native should probably work).

The important part is to grab its Application-ID &amp; also to give it enough permission to create users.

<a href="assets/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image23.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image_thumb23.png" alt="image" border="0" /></a>

In this scenario, the application is going to authenticate itself (as opposed to a user) so we need to define a secret.

<a href="assets/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image24.png"><img style="background-image:none;float:none;padding-top:0;padding-left:0;margin-left:auto;display:block;padding-right:0;margin-right:auto;border-width:0;" title="image" src="assets/2017/1/using-microsoft-graph-api-to-interact-with-azure-ad/image_thumb24.png" alt="image" border="0" /></a>

We’ll need to add a key, save &amp; copy the key value.

<h2>Authenticating with ADAL</h2>

This sample is in C# / .NET but since the Active Directory Authentication Library (<a href="https://msdn.microsoft.com/en-us/library/azure/mt417579.aspx">ADAL</a>) is available on multiple platform (e.g. Java), this should be easy to port.

We need to install the NuGet package <a href="https://www.nuget.org/packages/Microsoft.IdentityModel.Clients.ActiveDirectory/">Microsoft.IdentityModel.Clients.ActiveDirectory</a> in our project.

[code language="csharp"]
        private static async Task&lt;string&gt; AppAuthenticationAsync()
        {
            //  Constants
            var tenant = &quot;LdapVplDemo.onmicrosoft.com&quot;;
            var resource = &quot;https://graph.microsoft.com/&quot;;
            var clientID = &quot;9a9f5e70-5501-4e9c-bd00-d4114ebeb419&quot;;
            var secret = &quot;Ou+KN1DYv8337hG8o8+qRZ1EPqBMWwER/zvgqvmEe74=&quot;;

            //  Ceremony
            var authority = $&quot;https://login.microsoftonline.com/{tenant}&quot;;
            var authContext = new AuthenticationContext(authority);
            var credentials = new ClientCredential(clientID, secret);
            var authResult = await authContext.AcquireTokenAsync(resource, credentials);

            return authResult.AccessToken;
        }
[/code]

Here the <em>clientID </em>is the application ID of the application we created at <em>secret </em>is the secret key we created for it.

Here we return the access token as we’re going to use them.

<h2>Authenticating with HTTP POST</h2>

If we do not want to integrate with the ADAL, here’s the bare bone HTTP post version:

[code language="csharp"]
        private static async Task&lt;string&gt; HttpAppAuthenticationAsync()
        {
            //  Constants
            var tenant = &quot;LdapVplDemo.onmicrosoft.com&quot;;
            var clientID = &quot;9a9f5e70-5501-4e9c-bd00-d4114ebeb419&quot;;
            var resource = &quot;https://graph.microsoft.com/&quot;;
            var secret = &quot;Ou+KN1DYv8337hG8o8+qRZ1EPqBMWwER/zvgqvmEe74=&quot;;

            using (var webClient = new WebClient())
            {
                var requestParameters = new NameValueCollection();

                requestParameters.Add(&quot;resource&quot;, resource);
                requestParameters.Add(&quot;client_id&quot;, clientID);
                requestParameters.Add(&quot;grant_type&quot;, &quot;client_credentials&quot;);
                requestParameters.Add(&quot;client_secret&quot;, secret);

                var url = $&quot;https://login.microsoftonline.com/{tenant}/oauth2/token&quot;;
                var responsebytes = await webClient.UploadValuesTaskAsync(url, &quot;POST&quot;, requestParameters);
                var responsebody = Encoding.UTF8.GetString(responsebytes);
                var obj = JsonConvert.DeserializeObject&lt;JObject&gt;(responsebody);
                var token = obj[&quot;access_token&quot;].Value&lt;string&gt;();

                return token;
            }
        }
[/code]

Here I use the popular <a href="https://www.nuget.org/packages/Newtonsoft.Json/" target="_blank" rel="noopener">Newtonsoft Json Nuget Package</a> to handle JSON.

By no mean is the code here a master piece of robustness and style.  It is meant to be straightforward and easy to understand.  By all means, improve it %500 before calling it production ready!

<h2>Testing if a user exists</h2>

Here we’re going to use <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_get">Get a User</a> of Microsoft Graph API.

There is actually a NuGet package for <a href="https://www.nuget.org/packages/Microsoft.Graph" target="_blank" rel="noopener">Microsoft Graph API</a> and, in general <a href="https://graph.microsoft.io/en-us/code-samples-and-sdks" target="_blank" rel="noopener">SDKs (at the time of this writing) for 9 platforms</a>.

[code language="csharp"]
        private static async Task&lt;bool&gt; DoesUserExistsAsync(HttpClient client, string user)
        {
            try
            {
                var payload = await client.GetStringAsync($&quot;https://graph.microsoft.com/v1.0/users/{user}&quot;);

                return true;
            }
            catch (HttpRequestException)
            {
                return false;
            }
        }
[/code]

Again, the code is minimalist here.  The HTTP GET actually returns user information that could be used.

<h2>Returning the groups a user belong to</h2>

Here we’re going to use the <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_list_memberof" target="_blank" rel="noopener">memberof</a> method of Microsoft Graph API.

[code language="csharp"]
        private static async Task&lt;string[]&gt; GetUserGroupsAsync(HttpClient client, string user)
        {
            var payload = await client.GetStringAsync(
                $&quot;https://graph.microsoft.com/v1.0/users/{user}/memberOf&quot;);
            var obj = JsonConvert.DeserializeObject&lt;JObject&gt;(payload);
            var groupDescription = from g in obj[&quot;value&quot;]
                                   select g[&quot;displayName&quot;].Value&lt;string&gt;();

            return groupDescription.ToArray();
        }
[/code]

Here, we deserialize the returned payload to extract the group display names.  The information returned is richer and could be used.

<h2>Creating a new user</h2>

Finally we’re going to use the <a href="https://developer.microsoft.com/en-us/graph/docs/api-reference/v1.0/api/user_post_users" target="_blank" rel="noopener">Create User</a> method of Microsoft Graph API.

This is slightly more complicated as it is an HTTP POST with a JSON payload in input.

[code language="csharp"]
        private static async Task CreateUserAsync(HttpClient client, string user, string domain)
        {
            using (var stream = new MemoryStream())
            using (var writer = new StreamWriter(stream))
            {
                var payload = new
                {
                    accountEnabled = true,
                    displayName = user,
                    mailNickname = user,
                    userPrincipalName = $&quot;{user}@{domain}&quot;,
                    passwordProfile = new
                    {
                        forceChangePasswordNextSignIn = true,
                        password = &quot;tempPa$$w0rd&quot;
                    }
                };
                var payloadText = JsonConvert.SerializeObject(payload);

                writer.Write(payloadText);
                writer.Flush();
                stream.Flush();
                stream.Position = 0;

                using (var content = new StreamContent(stream))
                {
                    content.Headers.Add(&quot;Content-Type&quot;, &quot;application/json&quot;);

                    var response = await client.PostAsync(&quot;https://graph.microsoft.com/v1.0/users/&quot;, content);

                    if (!response.IsSuccessStatusCode)
                    {
                        throw new InvalidOperationException(response.ReasonPhrase);
                    }
                }
            }
        }

[/code]

<h2>Calling Code</h2>

The calling code looks like this:

[code language="csharp"]

        private static async Task Test()
        {
            //var token = await AppAuthenticationAsync();
            var token = await HttpAppAuthenticationAsync();

            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(&quot;Bearer&quot;, token);

                var user = &quot;test@LdapVplDemo.onmicrosoft.com&quot;;
                var userExist = await DoesUserExistsAsync(client, user);

                Console.WriteLine($&quot;Does user exists?  {userExist}&quot;);

                if (userExist)
                {
                    var groups = await GetUserGroupsAsync(client, user);

                    foreach (var g in groups)
                    {
                        Console.WriteLine($&quot;Group:  {g}&quot;);
                    }

                    await CreateUserAsync(client, &quot;newuser&quot;, &quot;LdapVplDemo.onmicrosoft.com&quot;);
                }
            }
        }

[/code]

<h2>Summary</h2>

We can see that using the Microsoft Graph API, most if not all LDAP query can easily be converted.

Microsoft Graph API is aligned with OData v3 which makes it a great REST API where filtering queries are standardized.