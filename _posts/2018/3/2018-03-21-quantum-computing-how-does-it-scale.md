---
title:  Quantum Computing - How does it scale?
date:  2018-03-21 06:30:14 -04:00
permalink:  "/2018/03/21/quantum-computing-how-does-it-scale/"
categories:
- Solution
tags:
- Mathematics
- Quantum
---
<a href="http://vincentlauzon.files.wordpress.com/2018/03/fractal-1240809_640.jpg"><img style="border:0 currentcolor;float:right;display:inline;background-image:none;" title="fractal-1240809_640" src="http://vincentlauzon.files.wordpress.com/2018/03/fractal-1240809_640_thumb.jpg" alt="fractal-1240809_640" width="320" height="180" align="right" border="0" /></a>We recently looked at <a href="https://vincentlauzon.com/2018/03/07/quantum-computing-value-proposition/">Quantum Computing value proposition</a>.  We then looked at <a href="https://vincentlauzon.com/2018/03/14/quantum-computing-scenarios/">scenarios where Quantum Computing would have a big impact</a>.

Quantum Computer can solve some problems by several order of magnitude. This brings today’s intractable problems to be easy to solve tomorrow.

The key reason for this computation power is Quantum Superposition.  In this article we’ll look at how this quantitatively impacts computing.  How does Quantum Computing perform compared to Classical Computing at different scale.
<h2>Classical Bits vs qubits</h2>
A classical bit can be either 0 or 1.  A quantum bit, or qubit, is a superposition of 0 <strong>and</strong> 1.

A single qubit therefore takes 2 classical values at once.  Every operation on the qubit is done on both values at once.

This is why we often hear that a qubit <em>packs</em> more information than a classical bit.

If we look at two bits, they can take the following values:
<ul>
 	<li>0, 0</li>
 	<li>0, 1</li>
 	<li>1, 0</li>
 	<li>1, 1</li>
</ul>
Two qubits take all those values at once.

We can see the pattern.  One qubit can take the value of two bits.  Two qubits can take the values of four bits.  In general, n qubits can take the values of 2<sup>n</sup>.
<h2>Interpretation</h2>
There are two ways of looking at this capacity scaling.  Let’s frame it in the simulation of Quantum Computing on a Classical Computer.

We could carry all possible classical state on operations.  This would increase the memory needed.

We could alternatively use one classical state at the time.  This would increase the number of iterations hence the compute time.

We are going to use those two angles to look at at the scaling of qubits.
<h2>Scaling</h2>
Here is a table giving us a comparison between classical and quantum bits at different scale.
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th># of qubits</th>
<th># bits / # loops</th>
<th>RAM</th>
</tr>
</thead>
<tbody>
<tr>
<td>1</td>
<td>2</td>
<td>2 bits</td>
</tr>
<tr>
<td>2</td>
<td>4</td>
<td>4 bits</td>
</tr>
<tr>
<td>3</td>
<td>8</td>
<td>1 byte</td>
</tr>
<tr>
<td>4</td>
<td>16</td>
<td>2 bytes</td>
</tr>
<tr>
<td>5</td>
<td>32</td>
<td>4 bytes</td>
</tr>
<tr>
<td>6</td>
<td>64</td>
<td>8 bytes</td>
</tr>
<tr>
<td>7</td>
<td>128</td>
<td>16 bytes</td>
</tr>
<tr>
<td>8</td>
<td>256</td>
<td>32 bytes</td>
</tr>
<tr>
<td>9</td>
<td>512</td>
<td>64 bytes</td>
</tr>
<tr>
<td>10</td>
<td>1024</td>
<td>128 bytes</td>
</tr>
<tr>
<td>11</td>
<td>2048</td>
<td>256 bytes</td>
</tr>
<tr>
<td>12</td>
<td>4096</td>
<td>512 bytes</td>
</tr>
<tr>
<td>13</td>
<td>8192</td>
<td>1 kB</td>
</tr>
</tbody>
</table>
We can see the explosive nature of the beast.  It takes only 13 qubits to store a kilobyte.  13 bits is just a byte and a half in comparison!

Let’s look at larger scale with both memory (as we did) and time.

For time, let’s assume we have a Classical Computer with a clock speed of 3 GHz.  Let’s also assume one operation on a classical state can be done in one clock cycle.  The computer could therefore perform 3 billion operations per second.

This estimate is a little optimistic but it gives an order of magnitude.
<table border="3">
<thead>
<tr style="background:green;color:white;">
<th># of qubits</th>
<th># bits /
# loops</th>
<th>RAM</th>
<th>Time</th>
</tr>
</thead>
<tbody>
<tr>
<td>13</td>
<td>8192</td>
<td>1 kB</td>
<td>2.73x10<sup>-6 </sup>s</td>
</tr>
<tr>
<td>20</td>
<td>1048576</td>
<td>128 kB</td>
<td>3.5x10<sup>-4</sup>s</td>
</tr>
<tr>
<td>23</td>
<td>8388608</td>
<td>1 MB</td>
<td>2.8x10<sup>-3</sup>s</td>
</tr>
<tr>
<td>33</td>
<td>8589934592</td>
<td>1 GB</td>
<td>2.9 s</td>
</tr>
<tr>
<td>43</td>
<td>8.8x10<sup>12</sup></td>
<td>1 TB</td>
<td>49 mins</td>
</tr>
<tr>
<td>53</td>
<td>9.0x10<sup>15</sup></td>
<td>1 PB</td>
<td>35 hours</td>
</tr>
<tr>
<td>63</td>
<td>9.2x10<sup>18</sup></td>
<td>1 EB</td>
<td>97.5 years</td>
</tr>
<tr>
<td>1000</td>
<td>1.1x10<sup>301</sup></td>
<td>1.3x10<sup>282</sup> EB</td>
<td>1.1x10<sup>284</sup> years</td>
</tr>
</tbody>
</table>
Those numbers drive the point home.

63 qubits contain as much classical bits as an Exabyte of data.

By comparison 63 bits is just under 8 bytes.  Just enough to store 8 characters!

If we look at it from an execution time perspective, it would take <strong>a century </strong>to simulate an operation on 63 qubits.

We added the thousand qubits row to show where this trend is going.

10<sup>301</sup> classical bits is a staggering number of bits.  For reference, it is <a href="https://en.wikipedia.org/wiki/Observable_universe#Matter_content_–_number_of_atoms">believed the universe contains 10<sup>80</sup> hydrogen atoms</a>.  So we would need more than<strong> three universes worth of hydrogen atoms </strong>to store those bits!

Operations on a thousand qubits would take 10<sup>284</sup> years to simulate.  The <a href="https://en.wikipedia.org/wiki/Age_of_the_universe">age of the universe is estimated at 13 billion (1.3x10<sup>10</sup>) years</a>.  Hence we would need to wait 28 times the current age of the universe to achieve that!
<h2>Summary</h2>
Clearly, this isn’t just a convenient speedup.

Quantum Computing opens up a different space of problems.

1000 qubits isn’t where the train stops.  It keeps going after that, with that the ability to solve problems we do not have vocabulary to express today!