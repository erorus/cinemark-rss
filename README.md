# Cinemark-RSS

This is a command-line tool that reads any Cinemark theatre's movie listings, combines it with an unofficial Rotten Tomatoes API, and generates an RSS feed of the data.

I use it to keep updated on which movies are in my local theatre.

## Usage

* Visit [cinemark.com](https://www.cinemark.com/) and navigate to your theatre.
* Find your theatre's numeric ID. One way to find it is to click the "Theatre Info" tab and check the email address (usually ###@cinemark.com).
* `node index.js $ID` will spit out the RSS to the console.

## Example Output

> ### Transformers: The Last Knight
>
> ![movie poster](https://www.cinemark.com/media/20672/md_t5_tlk.jpg)
>
> **Cinemark XD / RealD 3D / Reserved Seating**  
> 4:00pm - 11:00pm
>
> **RealD 3D / Reserved Seating**  
> 10:40am
>
> **Cinemark XD / Reserved Seating**  
> 12:30pm - 7:30pm
>
> **Digital Cinema / Reserved Seating**  
> 2:10pm - 5:40pm - 9:10pm
>
> [Rotten Tomatoes](https://www.rottentomatoes.com/m/transformers_the_last_knight_2017): 15% - Cacophonous, thinly plotted, and boasting state-of-the-art special effects, The Last Knight is pretty much what you'd expect from the fifth installment of the Transformers franchise.

## Note

This is my first node.js script. It's not robust. It's not elegant. It could certainly be done better. But it works. Don't judge. :)

## License

Copyright 2017 Gerard Dombroski

Licensed under the Apache License, Version 2.0 (the "License");
you may not use these files except in compliance with the License.
You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.