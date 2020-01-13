---
title: 'Applied SOA: Part 2 – SOA Basics'
date: 2011-11-27 09:08:00 -08:00
permalink: /2011/11/27/applied-soa-part-2-soa-basics/
categories:
- Solution
tags:
- API
---
<p>SoThis is part of a series of blog post about Applied SOA. The past blog entries are:</p>  <ul>   <li><a href="http://vincentlauzon.wordpress.com/2011/06/17/applied-soa-part-1-introduction/">Introduction</a> </li> </ul>  <p>In this article, I’ll cover the basics of SOA.</p>  <p>The hardest question for an Architect to answer briefly is ‘what is architecture’.&#160; Probably the second hardest question is ‘what is SOA’?&#160; In both cases, if you receive a quick answer you are getting short changed because you’re being served one definition that is used by a minority of people (obviously including the person you’re talking to).&#160; Let me try to have a go at it and keep in mind that I’ll likely exclude topics that others would consider core to SOA while including topics that others would consider non-SOA.&#160; The world is a big place with a lot of people.</p>  <p>If you have a Microsoft background, SOA probably resonate with the SOA four tenets:</p>  <ul>   <li>Boundaries are explicit </li>    <li>Services are autonomous </li>    <li>Services share schema and contract, not class </li>    <li>Service compatibility is determined based on policy </li> </ul>  <p>Sounds easy enough and familiar?&#160; If you dig a little you’ll find that those ‘SOA tenets’ were introduced by <a href="http://msdn.microsoft.com/en-us/magazine/cc164026.aspx">Don Box in a 2004 MSDN article</a> about Indigo, the project name of a technology that became WCF.&#160; Box defined them as SOA fundamentals, but really it had a strong inclination towards the solution, i.e. Web Services using WCF.&#160; Reading them today they sound more like a departure from CORBA, DCOM, .NET Remoting and distributed objects in general.&#160; That definition is good for the solution, i.e. it emphasis characteristics of the solutions.&#160; It doesn’t addressed why you would use services in a solution though.&#160; There is no mention of business processes, for instance.</p>  <p>Another popular definition of SOA is the <a href="http://www.soa-manifesto.org/">SOA Manifesto</a>.&#160; It is a longer and complete definition, is vendor neutral and is signed by 700 practitioner.&#160; It actually has tenets too:</p>  <ul>   <li>Business value over technical strategy </li>    <li>Strategic goals over project-specific benefits </li>    <li>Intrinsic interoperability over custom integration </li>    <li>Shared services over specific-purpose implementations </li>    <li>Flexibility over optimization </li>    <li>Evolutionary refinement over pursuit of initial perfection </li> </ul>  <p>Another definition, found in an <a href="http://soamag.com/I38/0410-1.php">article by Philip Wik</a> in <a href="http://soamag.com">SOA Magazine</a>, summarizes a school of thoughts centering SOA around business processes:</p>  <blockquote>   <p>The essence of SOA is to <strong>decompose business processes</strong> into <strong>discrete functional units or services</strong> and group existing or new business functions into business services.</p> </blockquote>  <p>(emphasis mine)</p>  <p>That definition has the merit of being brief, but it does exclude quite a lot of efforts undertaken in the industry.&#160; For instance, if you expose your employee information into a consolidated service, you’re not inside any business processes, so you’re not doing SOA?&#160; Primarily, you’re doing EAI in order to bridge your corporate AD, PeopleSoft, that Access DB your HR people are using despite your recommendation and what not.&#160; But the final result, the service, isn’t that a SOA artefact?</p>  <p>Ok, enough criticizing every definitions, let me pollute the air with my own tentative definition:</p>  <ul>   <li>SOA is an architecture style (as defined in <a href="http://www.togaf.info/">TOGAF</a>) </li>    <li>In a Service Oriented Architecture (SOA), services are first class citizen </li> </ul>  <p>Is that abstract enough?&#160; Ok, let me explain.</p>  <p>There are usually few architecture that purely follow one style.&#160; You might have multi-tier applications involved in some SOA but also involved into Web Architecture, distributed, etc.&#160; .&#160; The dominance of a style determines the style of a given architecture:&#160; if you have three servers talking to each other, 3-tier isn’t necessarily the corner stone of your architecture.</p>  <p>Now what does it mean to have services as first class citizen?&#160; It means that your architecture revolves around them.&#160; If you have web services in a system, it doesn’t mean you have SOA.</p>  <p>SOA is quite broad and these days it comes with a fair bit of ceremony.&#160; In order to broaden the reach of this blog series, I’ll address SOA concerns in general and how they can be applied in non-pure SOA.&#160; Hence the title:&#160; <em><strong>Applied</strong> SOA</em>!</p>  <p>There are different type of ‘Services’ with very different concerns out there.&#160; For instance:</p>  <table border="1" cellspacing="0" cellpadding="2"><tbody>     <tr bgcolor="#ee82ee">       <td align="center">         <p align="center"><strong>Examples</strong></p>       </td>        <td align="center">         <p align="center"><strong>Characteristics</strong></p>       </td>     </tr>      <tr>       <td valign="middle" align="center">         <p>High-Volume / Highly Isolated Services:</p>          <ul>           <li>Search Engine </li>            <li>Live ID </li>            <li>Messenger </li>         </ul>       </td>        <td valign="middle">         <ul>           <li>Data Isolation is a given </li>            <li>Data will be replicated on multitude of servers </li>            <li>Multitude front-end servers to satisfy demand </li>            <li>Simple protocol (often HTTP-REST) </li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">Business Process Driven</td>        <td valign="middle">         <ul>           <li>Surfaces data from multiple system </li>            <li>Data isn’t isolated but spread in different systems </li>            <li>The process determines the breakdown of services and service into operations not the complexity of implementing each operations </li>            <li>Often involves WS-* protocols (to support transactions for instance) </li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">         <p>System Integration Services</p>       </td>        <td valign="middle">         <ul>           <li>Services breakdown by system </li>            <li>Services expose data from a given system </li>            <li>No business process involved </li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">         <p>Enterprise Data Service</p>       </td>        <td valign="middle">         <ul>           <li>Autonomous service (e.g. own Database) </li>            <li>Expose a specific set of enterprise data </li>            <li>Other systems use its capabilities </li>            <li>Sort of the reverse of a System Integration Service, in this case the service is build first and applications are build after leveraging it </li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">Service Tier in an n-tier application</td>        <td valign="middle">         <ul>           <li>Typically services are consumed by only one consumer:&#160; the application’s front end </li>            <li>Strong coupling with the consumer in terms of platform protocol (e.g. SOAP over TCP using .NET binary formatting), data representation (data is ready to display on screen as opposed to be closer to an Enterprise Data Model) </li>         </ul>       </td>     </tr>   </tbody></table>  <p>To me, all those examples share some form of SOA and have SOA issues to address.</p>  <p>A final note on SOA basics.&#160; Typically a full-blown SOA Project have the following stakeholders, looking over different activities of the project:</p>  <ul>   <li>Business      <ul>       <li>Data &amp; Service Governance </li>        <li>Enterprise Architecture </li>        <li>Roadmaps (rarely done in one big bang project) </li>     </ul>   </li>    <li>IT      <ul>       <li>Operations </li>        <li>Monitoring </li>        <li>SLA, etc. </li>     </ul>   </li> </ul>  <p>I often give the following fictitious SOA project as an example to explain all those activities.&#160; I work for a big consulting company.&#160; Imagine my company wants to create an <em>Employee Service</em>.&#160; Simple enough?&#160; One service!&#160; The reason is simple:&#160; there are lots of systems containing information about employees, some syncs between them directly, some syncs transitively (via another system that in turn syncs with another one), some do not, etc.&#160; .&#160; The executives are sick about hearing about nightly job that didn’t work and affect the payroll or that a business unit is unable to search for skilled workers in another business unit because we use different systems.</p>  <table border="1" cellspacing="0" cellpadding="2"><tbody>     <tr bgcolor="#ee82ee">       <td align="center">         <p align="center"><strong>Activity</strong></p>       </td>        <td align="center">         <p align="center"><strong>Example</strong></p>       </td>     </tr>      <tr>       <td valign="middle" align="center">Governance</td>        <td valign="middle">         <ul>           <li>What is an employee?&#160; Actually, more basic, what is an employee ID?&#160; Is it the email, the employee number, the Active Directory Account name?</li>            <li>Is a past employee an employee or is it a separate concept?</li>            <li>Is a contractor an employee?</li>            <li>Is a prospect an employee?&#160; If so, what’s his ID?&#160; Is not, how does recruiting work with the future service?</li>            <li>Who can view and modify what attributes?</li>            <li>What are the fundamental operations to perform on an employee?</li>            <li>How do we version the data &amp; operations along time?</li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">Enterprise Architecture</td>        <td valign="middle">         <ul>           <li>What will v1 include?&#160; E.g. a restful GET on the intranet</li>            <li>What’s the roadmap for future versions, what systems will integrate along the way?</li>            <li>How to open part of the service to partners at some point in time?</li>            <li>How to make some operations accessible to different departments?</li>         </ul>       </td>     </tr>      <tr>       <td valign="middle" align="center">Operations</td>        <td valign="middle">         <ul>           <li>What’s the helpdesk strategy?</li>            <li>How do we monitor that service?</li>            <li>What is the promised SLA?</li>            <li>Work around if the service fails for a longer period?</li>         </ul>       </td>     </tr>   </tbody></table>  <p>So guess what?&#160; Those projects are expensive.&#160; It is often hard to justify the long-term benefit.&#160; Therefore?&#160; They involve a lot of politics! </p>  <p><a href="/assets/posts/2011/4/applied-soa-part-2-soa-basics/image1.png"><img style="background-image:none;padding-left:0;padding-right:0;display:inline;float:left;padding-top:0;border-width:0;" title="image" border="0" alt="image" align="left" src="/assets/posts/2011/4/applied-soa-part-2-soa-basics/image_thumb1.png" width="230" height="244" /></a>A good predictor for a Service Oriented Architecture could be:</p>  <ul>   <li>It has several concerns described above </li>    <li>It involves a lot of politics </li> </ul>