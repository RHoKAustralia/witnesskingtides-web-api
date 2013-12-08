using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WitnessKingTides.Mobile.Web.Models;
using WitnessKingTides.Mobile.Web.Services;

namespace WitnessKingTides.Mobile.Web.Controllers
{
    public class HomeController : Controller
    {
        FlickrService _flickrService;

        public HomeController()
        {
            _flickrService = new FlickrService();
        }

        [HttpPost]
        public JsonResult SavePhoto(TideTrackerInputModel inputModel)
        {
            var result = ProcessUploadPhoto(inputModel);

            return Json(result);
        }

        [HttpPost]
        [ActionName("Index")]
        public ActionResult Index_Post(TideTrackerInputModel inputModel)
        {
            var result = ProcessUploadPhoto(inputModel);
            inputModel.FlickrId = result.FlickrId;

            return View(inputModel);
        }

        public ActionResult Index()
        {
            return View();
        }

        private UploadPhotoResult ProcessUploadPhoto(TideTrackerInputModel inputModel)
        {
            var result = new UploadPhotoResult();

            if (Request.Files.Count == 1 && inputModel.PhotoFile != null)
            {
                DateTime creationDate = inputModel.CreationDate ?? DateTime.Now;
                string[] latLong = inputModel.PhotoLocation.Split(new char[] { ' ' });

                var apiModel = new WitnessKingTidesApiInputModel
                {
                    Email = inputModel.Email,
                    FirstName = inputModel.FirstName,
                    LastName = inputModel.LastName,
                    Latitude = Decimal.Parse(latLong[1]),
                    Longitude = Decimal.Parse(latLong[0]),
                    CreationTime = creationDate
                };

                using (var binaryReader = new BinaryReader(inputModel.PhotoFile.InputStream))
                {
                    apiModel.Photo = binaryReader.ReadBytes(inputModel.PhotoFile.ContentLength);
                }

                result.FlickrId = _flickrService.Upload(apiModel);
                result.Latitude = apiModel.Latitude;
                result.Longitude = apiModel.Longitude;
            }

            return result;
        }
    }
}