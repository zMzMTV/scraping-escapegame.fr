const puppeteer = require("puppeteer");
const fs = require("fs");

const URL = "https://www.escapegame.fr/paris/";
const URL1 =
  "https://www.escapegame.fr/paris/you-have-sixty-minutes/cannibale-paris-chapitre-2/";

let rooms;

const saveToFile = (data) => {
  fs.writeFile("./data/rooms.json", JSON.stringify(data), "utf8", (error) => {
    if (error) {
      console.log("scrapping terminé !");
    }
  });
};

const getGames = async () => {
  // Initialized browser
  const browser = await puppeteer.launch();
  // Open new page
  const page = await browser.newPage();
  // url to scrap and {wait the end of the loading to execute action}
  await page.goto(URL, { waitUntil: "networkidle2" });

  const games = await page.evaluate(() => {
    return [...document.querySelectorAll("#jsRooms > .card-room")].map(
      (ele) => {
        return {
          name: ele.querySelector(".card-title a").textContent,
          brand: ele.querySelector(".card-room-brand").textContent,
          summary: ele.querySelector(".room-summary").textContent.trim(),
          snooping:
            ele.querySelector(".room-snooping") &&
            Number(
              ele
                .querySelector(".room-snooping")
                .textContent.trim()
                .split(" ")[0]
                .slice(0, -1)
            ),
          handling:
            ele.querySelector(".room-handling") &&
            Number(
              ele
                .querySelector(".room-handling")
                .textContent.trim()
                .split(" ")[0]
                .slice(0, -1)
            ),
          thinking:
            ele.querySelector(".room-thinking") &&
            Number(
              ele
                .querySelector(".room-thinking")
                .textContent.trim()
                .split(" ")[0]
                .slice(0, -1)
            ),
          rating:
            ele.querySelector(".rating-full") &&
            Number(
              (
                Number(
                  ele
                    .querySelector(".rating-full")
                    .getAttribute("style")
                    .split(" ")[1]
                    .slice(0, -3)
                ) / 17
              ).toFixed(1)
            ),
          "user-rating":
            ele.querySelector(".user-rating") &&
            Number(
              ele.querySelector(".user-rating").textContent.trim().split("%")[0]
            ),
          thumbnail: ele
            .querySelector(".card-room-hero-image")
            .getAttribute("data-src")
            .split("?")[0],
          domain: ele.querySelector(".card-title a").getAttribute("href"),
        };
      }
    );
  });

  // Close browser
  await browser.close();
  console.log("getMoreAboutGames");
  rooms = games;
  getMoreAboutGames(0);
};

getGames();

const getMoreAboutGames = async (index) => {
  if (index < rooms.length - 1) {
    // Initialized browser
    const browser = await puppeteer.launch({ headless: false });
    // Open new page
    const page = await browser.newPage();
    // url to scrap and {wait the end of the loading to execute action}
    await page.goto(rooms[index].domain, { waitUntil: "networkidle2" });

    /* SUMMARY */
    const summary = await page.evaluate(() => {
      return document.querySelector(".entry-content").innerText;
    });

    /* AVAILABILITIES */
    const availabilities = await page.evaluate(() => {
      return (
        document.querySelector(".button-blue") &&
        document
          .querySelector(".button-blue")
          .getAttribute("href")
          .split("?")[0] // to be sure to keep only the source URL
      );
    });

    /* ROOM ADRESSES */
    const roomAdresses = await page.evaluate(() => {
      return [...document.querySelectorAll(".room-address")].map((ele) => {
        return {
          link: ele.getAttribute("href"),
          location: ele.innerText,
          coord: JSON.stringify({
            lat: ele.getAttribute("href").split("=")[1].split(",")[0],
            long: ele.getAttribute("href").split("=")[1].split(",")[1],
          }),
        };
      });
    });

    /* BOOKING */
    const booking = await page.evaluate(() => {
      return (
        document.querySelector(".sticky-cta-sm a") &&
        document
          .querySelector(".sticky-cta-sm a")
          .getAttribute("href")
          .split("?")[0]
      );
    });

    /* SPECS */
    const specs = await page.evaluate(() => {
      return [...document.querySelectorAll(".room-specs li")].map((ele) => {
        const key = ele.innerText.split("\n")[0];
        const value = ele.innerText.split("\n")[1];
        return { [key]: value };
      });
    });

    // Close browser
    await browser.close();
    rooms[index] = {
      ...rooms[index],
      summary,
      availabilities,
      roomAdresses,
      booking,
      specs,
    };
    index++;
    console.log(`l'escape game ${rooms[index].name} à bien été scrapé !`);
    getMoreAboutGames(index);
  } else {
    // Saved data in a file
    saveToFile(rooms);
  }
};
